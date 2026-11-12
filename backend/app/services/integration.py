import numpy as np

def compute_luminance_stats(luminance: np.ndarray) -> dict:
    """
    Computes rigorous mathematical metrics from a 2D float32 luminance matrix.
    Model:
    Continuous: T = ∬_D B(x,y) dA
    Discrete:   T ≈ Σ Σ B(i,j) · ΔA  (with ΔA = 1)
    """
    height, width = luminance.shape
    total_pixels = int(height * width)

    if total_pixels == 0:
        return {
            "width": 0,
            "height": 0,
            "total_pixels": 0,
            "total_brightness": 0.0,
            "average_brightness": 0.0,
            "normalized_average": 0.0,
            "min_brightness": 0.0,
            "max_brightness": 0.0,
            "histogram": [0] * 256,
            "row_profile_sample": [],
            "col_profile_sample": [],
        }

    # Sum of float32 values preserves true mathematical intensity without display rounding
    total_brightness = float(np.sum(luminance, dtype=np.float64))
    min_brightness = float(np.min(luminance))
    max_brightness = float(np.max(luminance))

    average_brightness = total_brightness / total_pixels
    normalized_average = (average_brightness / 255.0) * 100.0

    # 256-bin histogram over [0..255]
    clamped_display = np.clip(np.round(luminance), 0, 255).astype(np.int32)
    hist_counts, _ = np.histogram(clamped_display, bins=256, range=(0, 256))
    histogram = hist_counts.tolist()

    # Center row and column profiles for initial visualization
    center_row = height // 2
    center_col = width // 2
    row_profile = luminance[center_row, :].tolist()
    col_profile = luminance[:, center_col].tolist()

    return {
        "width": width,
        "height": height,
        "total_pixels": total_pixels,
        "total_brightness": round(total_brightness, 4),
        "average_brightness": round(average_brightness, 4),
        "normalized_average": round(normalized_average, 4),
        "min_brightness": round(min_brightness, 2),
        "max_brightness": round(max_brightness, 2),
        "histogram": histogram,
        "row_profile_sample": row_profile,
        "col_profile_sample": col_profile,
    }

def compute_region_integration(
    luminance: np.ndarray, x: int, y: int, width: int, height: int
) -> dict:
    """
    Evaluates the double integral over a rectangular sub-domain D_sub = [x1, x2] x [y1, y2].
    T_ROI = ∬_{D_sub} B(x,y) dA ≈ Σ_{i=y1}^{y2} Σ_{j=x1}^{x2} B(i,j)
    """
    img_h, img_w = luminance.shape

    # Handle negative width/height (dragged in reverse)
    x1 = min(x, x + width)
    x2 = max(x, x + width)
    y1 = min(y, y + height)
    y2 = max(y, y + height)

    # Clamp coordinates to image boundaries
    x1 = max(0, min(img_w - 1, int(x1)))
    x2 = max(0, min(img_w - 1, int(x2)))
    y1 = max(0, min(img_h - 1, int(y1)))
    y2 = max(0, min(img_h - 1, int(y2)))

    # Pixel slice: y from y1 to y2 inclusive, x from x1 to x2 inclusive
    sub_matrix = luminance[y1 : y2 + 1, x1 : x2 + 1]
    sub_h, sub_w = sub_matrix.shape
    pixel_count = int(sub_h * sub_w)

    if pixel_count == 0:
        return {
            "region": {"x": x1, "y": y1, "width": 0, "height": 0},
            "pixel_count": 0,
            "total_brightness": 0.0,
            "average_brightness": 0.0,
            "normalized_average": 0.0,
            "min_brightness": 0.0,
            "max_brightness": 0.0,
            "histogram": [0] * 256,
        }

    total_brightness = float(np.sum(sub_matrix, dtype=np.float64))
    min_brightness = float(np.min(sub_matrix))
    max_brightness = float(np.max(sub_matrix))

    average_brightness = total_brightness / pixel_count
    normalized_average = (average_brightness / 255.0) * 100.0

    clamped_display = np.clip(np.round(sub_matrix), 0, 255).astype(np.int32)
    hist_counts, _ = np.histogram(clamped_display, bins=256, range=(0, 256))

    return {
        "region": {"x": x1, "y": y1, "width": sub_w, "height": sub_h},
        "pixel_count": pixel_count,
        "total_brightness": round(total_brightness, 4),
        "average_brightness": round(average_brightness, 4),
        "normalized_average": round(normalized_average, 4),
        "min_brightness": round(min_brightness, 2),
        "max_brightness": round(max_brightness, 2),
        "histogram": hist_counts.tolist(),
    }

