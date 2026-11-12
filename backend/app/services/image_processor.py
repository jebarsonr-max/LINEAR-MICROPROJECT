import io
import base64
import numpy as np
from PIL import Image
from ..config import settings

class ImageProcessingError(Exception):
    pass

def decode_and_process_image(file_bytes: bytes, filename: str) -> dict:
    """
    Decodes an image from raw bytes, handles transparency compositing,
    computes float32 ITU-R BT.601 luminance matrix, and generates previews.
    """
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise ImageProcessingError(
            f"File size ({len(file_bytes) / (1024*1024):.1f} MB) exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_MB} MB."
        )

    try:
        pil_image = Image.open(io.BytesIO(file_bytes))
        pil_image.verify()
        # Re-open because verify() closes/invalidates the image object
        pil_image = Image.open(io.BytesIO(file_bytes))
    except Exception as e:
        raise ImageProcessingError("Corrupted or invalid image file. Unable to decode image.") from e

    width, height = pil_image.size
    if width * height > settings.MAX_PIXELS:
        raise ImageProcessingError(
            f"Image dimensions ({width}x{height} = {width*height:,} pixels) exceed safety limit of {settings.MAX_PIXELS:,} pixels."
        )

    # Convert to RGBA
    rgba_img = pil_image.convert("RGBA")
    rgba_array = np.array(rgba_img, dtype=np.float32)

    # Transparency compositing over documented background (pure white: 255, 255, 255)
    rgb = rgba_array[:, :, :3]
    alpha = rgba_array[:, :, 3:4] / 255.0
    bg = np.array(settings.DEFAULT_ALPHA_BG, dtype=np.float32).reshape(1, 1, 3)

    composited_rgb = rgb * alpha + bg * (1.0 - alpha)

    # ITU-R BT.601 Luminance calculation: Gray = 0.299R + 0.587G + 0.114B
    # Preserves 32-bit float precision for numerical integration
    r = composited_rgb[:, :, 0]
    g = composited_rgb[:, :, 1]
    b = composited_rgb[:, :, 2]
    luminance = 0.299 * r + 0.587 * g + 0.114 * b

    # Create grayscale visual image (clamped and rounded to uint8 for display)
    gray_display = np.clip(np.round(luminance), 0, 255).astype(np.uint8)
    gray_pil = Image.fromarray(gray_display, mode="L")

    # Generate Grayscale PNG Base64 Data URL (scaled down if extremely large for preview responsiveness)
    preview_pil = gray_pil.copy()
    if max(width, height) > 1200:
        preview_pil.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    
    preview_buffer = io.BytesIO()
    preview_pil.save(preview_buffer, format="PNG", optimize=True)
    preview_base64 = "data:image/png;base64," + base64.b64encode(preview_buffer.getvalue()).decode("utf-8")

    # Generate compact thumbnail for history
    thumb_pil = gray_pil.copy()
    thumb_pil.thumbnail((160, 160), Image.Resampling.LANCZOS)
    thumb_buffer = io.BytesIO()
    thumb_pil.save(thumb_buffer, format="JPEG", quality=80)
    thumbnail_base64 = "data:image/jpeg;base64," + base64.b64encode(thumb_buffer.getvalue()).decode("utf-8")

    # Original RGB thumbnail
    orig_thumb_pil = pil_image.convert("RGB")
    orig_thumb_pil.thumbnail((160, 160), Image.Resampling.LANCZOS)
    orig_thumb_buffer = io.BytesIO()
    orig_thumb_pil.save(orig_thumb_buffer, format="JPEG", quality=80)
    orig_thumb_base64 = "data:image/jpeg;base64," + base64.b64encode(orig_thumb_buffer.getvalue()).decode("utf-8")

    return {
        "width": width,
        "height": height,
        "luminance": luminance, # np.ndarray (float32)
        "preview_base64": preview_base64,
        "thumbnail_base64": thumbnail_base64,
        "orig_thumbnail_base64": orig_thumb_base64,
        "filename": filename
    }
