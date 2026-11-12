import json
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AnalysisRecord
from ..schemas import HistoryItem
from ..services.cache import delete_cached_analysis

router = APIRouter(prefix="/api/history", tags=["History"])

@router.get("", response_model=List[HistoryItem])
def list_history(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Returns stored analysis records from SQLite in reverse chronological order.
    """
    records = (
        db.query(AnalysisRecord)
        .order_by(AnalysisRecord.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        HistoryItem(
            id=r.id,
            filename=r.filename,
            width=r.width,
            height=r.height,
            total_pixels=r.total_pixels,
            total_brightness=r.total_brightness,
            average_brightness=r.average_brightness,
            normalized_average=r.normalized_average,
            min_brightness=r.min_brightness,
            max_brightness=r.max_brightness,
            thumbnail_base64=r.thumbnail_base64,
            created_at=r.created_at.isoformat() if r.created_at else "",
            simulation_summary=r.simulation_summary
        )
        for r in records
    ]

@router.get("/{analysis_id}")
def get_history_detail(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns full details for a specific analysis record including its histogram.
    """
    record = db.query(AnalysisRecord).filter(AnalysisRecord.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Record '{analysis_id}' not found.")

    res = record.to_dict()
    res["histogram"] = json.loads(record.histogram_json) if record.histogram_json else []
    return res

@router.delete("/{analysis_id}")
def delete_history_item(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    """
    Deletes an analysis record from SQLite and purges active session cache.
    """
    record = db.query(AnalysisRecord).filter(AnalysisRecord.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Record '{analysis_id}' not found.")

    db.delete(record)
    db.commit()
    delete_cached_analysis(analysis_id)
    return {"status": "deleted", "id": analysis_id}

