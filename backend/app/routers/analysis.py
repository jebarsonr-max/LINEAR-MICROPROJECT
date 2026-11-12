import json
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AnalysisRecord
from ..schemas import AnalysisResponse, RegionRequest, RegionResponse, SimulationRequest, SimulationResponse
from ..services.image_processor import decode_and_process_image, ImageProcessingError
from ..services.integration import compute_luminance_stats, compute_region_integration
from ..services.simulator import run_simulation
from ..services.cache import store_analysis, get_cached_analysis

router = APIRouter(prefix="/api", tags=["Analysis & Integration"])

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts an image upload, calculates ITU-R BT.601 luminance,
    evaluates discrete double integration, stores in SQLite, and returns full metrics.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename in upload.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        proc_data = decode_and_process_image(content, file.filename)
    except ImageProcessingError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image decoding failed: {str(e)}")

    # Calculate exact mathematical stats
    stats = compute_luminance_stats(proc_data["luminance"])
    stats["preview_base64"] = proc_data["preview_base64"]
    stats["thumbnail_base64"] = proc_data["thumbnail_base64"]

    # Save to SQLite
    record = AnalysisRecord(
        filename=file.filename,
        width=proc_data["width"],
        height=proc_data["height"],
        total_pixels=stats["total_pixels"],
        total_brightness=stats["total_brightness"],
        average_brightness=stats["average_brightness"],
        normalized_average=stats["normalized_average"],
        min_brightness=stats["min_brightness"],
        max_brightness=stats["max_brightness"],
        thumbnail_base64=proc_data["thumbnail_base64"],
        histogram_json=json.dumps(stats["histogram"])
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Cache float32 matrix in memory for fast ROI & simulation without disk I/O
    store_analysis(proc_data["luminance"], file.filename, stats, record.id)

    return {
        "analysis_id": record.id,
        "filename": record.filename,
        "stats": stats,
        "created_at": record.created_at.isoformat()
    }

@router.post("/integrate", response_model=RegionResponse)
async def integrate_region(
    payload: RegionRequest
):
    """
    Evaluates sub-domain double integration over region D_sub = [x, y, w, h].
    """
    if not payload.analysis_id:
        raise HTTPException(status_code=400, detail="analysis_id is required.")

    cached = get_cached_analysis(payload.analysis_id)
    if not cached:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis session '{payload.analysis_id}' not found in active session cache. Please re-analyze the image."
        )

    res = compute_region_integration(
        cached["luminance"],
        payload.x,
        payload.y,
        payload.width,
        payload.height
    )
    res["analysis_id"] = payload.analysis_id
    return res

@router.post("/simulate", response_model=SimulationResponse)
async def simulate_brightness_transformation(
    payload: SimulationRequest,
    db: Session = Depends(get_db)
):
    """
    Applies I_new = clamp(contrast * (I_orig - 127.5) + 127.5 + offset, 0, 255)
    and recalculates all integration metrics from the transformed values.
    """
    cached = get_cached_analysis(payload.analysis_id)
    if not cached:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis session '{payload.analysis_id}' not found in active cache. Please re-analyze image."
        )

    sim_res = run_simulation(
        cached["luminance"],
        payload.brightness_offset,
        payload.contrast
    )

    # Update summary in DB
    record = db.query(AnalysisRecord).filter(AnalysisRecord.id == payload.analysis_id).first()
    if record:
        record.simulation_summary = json.dumps({
            "offset": payload.brightness_offset,
            "contrast": payload.contrast,
            "delta_total": sim_res["delta_total"],
            "delta_average": sim_res["delta_average"],
            "percentage_change": sim_res["percentage_change"]
        })
        db.commit()

    return {
        "analysis_id": payload.analysis_id,
        "brightness_offset": payload.brightness_offset,
        "contrast": payload.contrast,
        "original_total": sim_res["original_total"],
        "original_average": sim_res["original_average"],
        "transformed_stats": sim_res["transformed_stats"],
        "delta_total": sim_res["delta_total"],
        "delta_average": sim_res["delta_average"],
        "percentage_change": sim_res["percentage_change"],
        "transformed_preview_base64": sim_res["transformed_preview_base64"]
    }
