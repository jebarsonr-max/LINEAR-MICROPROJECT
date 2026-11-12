import uuid
from typing import Dict, Any

# In-memory session store mapping analysis_id -> { "luminance": np.ndarray, "filename": str, "stats": dict }
_analysis_cache: Dict[str, Any] = {}

def store_analysis(luminance, filename: str, stats: dict, analysis_id: str = None) -> str:
    if not analysis_id:
        analysis_id = str(uuid.uuid4())
    _analysis_cache[analysis_id] = {
        "luminance": luminance,
        "filename": filename,
        "stats": stats,
    }
    return analysis_id

def get_cached_analysis(analysis_id: str) -> Any:
    return _analysis_cache.get(analysis_id)

def delete_cached_analysis(analysis_id: str) -> bool:
    if analysis_id in _analysis_cache:
        del _analysis_cache[analysis_id]
        return True
    return False
