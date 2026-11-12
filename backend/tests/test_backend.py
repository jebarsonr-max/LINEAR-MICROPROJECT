import io
import json
import numpy as np
import pytest
from PIL import Image

from app.database import Base, engine, SessionLocal, init_db
from app.models import AnalysisRecord
from app.main import health_check
from app.services.integration import compute_luminance_stats, compute_region_integration
from app.services.simulator import run_simulation
from app.services.image_processor import decode_and_process_image, ImageProcessingError
from app.services.report_generator import generate_pdf_report
from app.services.cache import store_analysis, get_cached_analysis, delete_cached_analysis

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_health_check_endpoint():
    res = health_check()
    assert res["status"] == "online"
    assert res["version"] == "2.0.0"
    assert "numpy_version" in res

def test_specification_3x3_benchmark_matrix():
    """
    Test Phase 11 / Project Spec:
    Matrix A = [[10, 20, 30], [40, 50, 60], [70, 80, 90]]
    Verify:
    - Pixel count = 9
    - Total brightness = 450
    - Average brightness = 50.00
    - Normalized average = ~19.61%
    - Min = 10
    - Max = 90
    """
    matrix = np.array([
        [10.0, 20.0, 30.0],
        [40.0, 50.0, 60.0],
        [70.0, 80.0, 90.0]
    ], dtype=np.float32)

    stats = compute_luminance_stats(matrix)

    assert stats["total_pixels"] == 9
    assert stats["total_brightness"] == 450.0
    assert stats["average_brightness"] == 50.0
    assert pytest.approx(stats["normalized_average"], 0.01) == 19.61
    assert stats["min_brightness"] == 10.0
    assert stats["max_brightness"] == 90.0

def test_all_black_image():
    black_matrix = np.zeros((4, 4), dtype=np.float32)
    stats = compute_luminance_stats(black_matrix)
    assert stats["total_pixels"] == 16
    assert stats["total_brightness"] == 0.0
    assert stats["average_brightness"] == 0.0
    assert stats["normalized_average"] == 0.0
    assert stats["min_brightness"] == 0.0
    assert stats["max_brightness"] == 0.0
    assert stats["histogram"][0] == 16

def test_all_white_image():
    white_matrix = np.full((3, 3), 255.0, dtype=np.float32)
    stats = compute_luminance_stats(white_matrix)
    assert stats["total_pixels"] == 9
    assert stats["total_brightness"] == 9 * 255.0
    assert stats["average_brightness"] == 255.0
    assert stats["normalized_average"] == 100.0
    assert stats["min_brightness"] == 255.0
    assert stats["max_brightness"] == 255.0
    assert stats["histogram"][255] == 9

def test_transparent_png_compositing():
    img = Image.new("RGBA", (2, 2), (0, 0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    file_bytes = buf.getvalue()

    proc = decode_and_process_image(file_bytes, "transparent.png")
    stats = compute_luminance_stats(proc["luminance"])
    assert stats["total_pixels"] == 4
    assert pytest.approx(stats["average_brightness"], 0.1) == 255.0
    assert pytest.approx(stats["total_brightness"], 0.1) == 1020.0

def test_invalid_upload_handling():
    # Empty file
    with pytest.raises(ImageProcessingError):
        decode_and_process_image(b"", "empty.png")

    # Corrupt data
    with pytest.raises(ImageProcessingError):
        decode_and_process_image(b"not_an_image_binary_data", "bad.jpg")

def test_region_integration_roi():
    matrix = np.arange(1, 17, dtype=np.float32).reshape(4, 4)
    res = compute_region_integration(matrix, x=1, y=1, width=1, height=1)
    assert res["pixel_count"] == 4
    assert res["total_brightness"] == 34.0
    assert res["average_brightness"] == 8.5
    assert res["min_brightness"] == 6.0
    assert res["max_brightness"] == 11.0

def test_simulator_and_zero_division_safety():
    matrix = np.full((2, 2), 100.0, dtype=np.float32)
    sim = run_simulation(matrix, brightness_offset=20.0, contrast=1.0)
    assert sim["transformed_stats"]["average_brightness"] == 120.0
    assert sim["delta_total"] == 80.0
    assert sim["percentage_change"] == 20.0

    black_matrix = np.zeros((2, 2), dtype=np.float32)
    sim_black = run_simulation(black_matrix, brightness_offset=30.0, contrast=1.0)
    assert sim_black["percentage_change"] is None
    assert sim_black["delta_total"] > 0

def test_database_and_report_flow(db):
    # 1. Process 3x3 synthetic image
    img = Image.new("RGB", (3, 3), color=(60, 120, 180))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    proc = decode_and_process_image(buf.getvalue(), "test_db.png")

    stats = compute_luminance_stats(proc["luminance"])

    # 2. Insert into SQLite
    rec = AnalysisRecord(
        filename="test_db.png",
        width=proc["width"],
        height=proc["height"],
        total_pixels=stats["total_pixels"],
        total_brightness=stats["total_brightness"],
        average_brightness=stats["average_brightness"],
        normalized_average=stats["normalized_average"],
        min_brightness=stats["min_brightness"],
        max_brightness=stats["max_brightness"],
        thumbnail_base64=proc["thumbnail_base64"],
        histogram_json=json.dumps(stats["histogram"])
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    assert rec.id is not None

    # 3. Cache session
    store_analysis(proc["luminance"], rec.filename, stats, rec.id)
    cached = get_cached_analysis(rec.id)
    assert cached is not None
    assert cached["filename"] == "test_db.png"

    # 4. Generate PDF report
    pdf_bytes = generate_pdf_report(rec.to_dict(), simulation_data={"delta_total": 45.0, "percentage_change": 12.5})
    assert len(pdf_bytes) > 500
    assert pdf_bytes[:4] == b"%PDF"

    # 5. Clean up
    delete_cached_analysis(rec.id)
    assert get_cached_analysis(rec.id) is None
    db.delete(rec)
    db.commit()
