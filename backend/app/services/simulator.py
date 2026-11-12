import io
import base64
import numpy as np
from PIL import Image
from .integration import compute_luminance_stats

def run_simulation(
    original_luminance: np.ndarray,
    brightness_offset: float,
    contrast: float
) -> dict:
    """
    Applies the specified affine brightness and contrast transformation:
    I_new = clamp(contrast * (I_original - 127.5) + 127.5 + brightness_offset, 0, 255)
    Recalculates exact metrics on transformed values.
    """
    orig_stats = compute_luminance_stats(original_luminance)
    orig_total = orig_stats["total_brightness"]
    orig_average = orig_stats["average_brightness"]

    # Transform formula in float32
    transformed_lum = contrast * (original_luminance - 127.5) + 127.5 + brightness_offset
    transformed_lum = np.clip(transformed_lum, 0.0, 255.0)

    # Recompute metrics from real transformed values
    trans_stats = compute_luminance_stats(transformed_lum)
    new_total = trans_stats["total_brightness"]
    new_average = trans_stats["average_brightness"]

    delta_total = new_total - orig_total
    delta_average = new_average - orig_average

    # Guard against division by zero if original total brightness is zero (pitch black)
    percentage_change = None
    if orig_total > 0:
        percentage_change = round((delta_total / orig_total) * 100.0, 4)

    # Render preview
    h, w = transformed_lum.shape
    gray_display = np.clip(np.round(transformed_lum), 0, 255).astype(np.uint8)
    pil_img = Image.fromarray(gray_display, mode="L")
    if max(w, h) > 1000:
        pil_img.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
    
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG", optimize=True)
    transformed_preview_base64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

    return {
        "transformed_stats": trans_stats,
        "original_total": orig_total,
        "original_average": orig_average,
        "delta_total": round(delta_total, 4),
        "delta_average": round(delta_average, 4),
        "percentage_change": percentage_change,
        "transformed_preview_base64": transformed_preview_base64,
        "transformed_luminance": transformed_lum
    }

