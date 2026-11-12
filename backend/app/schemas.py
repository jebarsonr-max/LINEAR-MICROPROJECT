from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ImageStatsResponse(BaseModel):
    width: int
    height: int
    total_pixels: int
    total_brightness: float
    average_brightness: float
    normalized_average: float
    min_brightness: float
    max_brightness: float
    histogram: List[int]
    preview_base64: Optional[str] = None
    thumbnail_base64: Optional[str] = None
    row_profile_sample: Optional[List[float]] = None # Center row sample for quick plotting
    col_profile_sample: Optional[List[float]] = None # Center col sample for quick plotting

class AnalysisResponse(BaseModel):
    analysis_id: str
    filename: str
    stats: ImageStatsResponse
    created_at: str

class RegionRequest(BaseModel):
    analysis_id: Optional[str] = None
    x: int = Field(..., description="Top-left X coordinate")
    y: int = Field(..., description="Top-left Y coordinate")
    width: int = Field(..., description="Region width (pixels)")
    height: int = Field(..., description="Region height (pixels)")

class RegionResponse(BaseModel):
    analysis_id: Optional[str] = None
    region: Dict[str, int]
    pixel_count: int
    total_brightness: float
    average_brightness: float
    normalized_average: float
    min_brightness: float
    max_brightness: float
    histogram: List[int]
    mathematical_model: str = "T_ROI = ∬_ROI B(x,y) dA ≈ Σ Σ B(i,j) · ΔA (ΔA = 1)"

class SimulationRequest(BaseModel):
    analysis_id: str
    brightness_offset: float = Field(0.0, ge=-100.0, le=100.0, description="Additive brightness delta")
    contrast: float = Field(1.0, ge=0.0, le=3.0, description="Contrast multiplier (default 1.0)")

class SimulationResponse(BaseModel):
    analysis_id: str
    brightness_offset: float
    contrast: float
    original_total: float
    original_average: float
    transformed_stats: ImageStatsResponse
    delta_total: float
    delta_average: float
    percentage_change: Optional[float]
    transformed_preview_base64: str

class HistoryItem(BaseModel):
    id: str
    filename: str
    width: int
    height: int
    total_pixels: int
    total_brightness: float
    average_brightness: float
    normalized_average: float
    min_brightness: float
    max_brightness: float
    thumbnail_base64: Optional[str] = None
    created_at: str
    simulation_summary: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    service: str
    numpy_version: str
