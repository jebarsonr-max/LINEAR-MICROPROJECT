import json
from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AnalysisRecord
from ..services.report_generator import generate_pdf_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.post("/{analysis_id}")
def generate_analysis_report(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    """
    Generates and returns a downloadable formal academic PDF report for the given analysis record.
    """
    record = db.query(AnalysisRecord).filter(AnalysisRecord.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found.")

    record_data = record.to_dict()
    simulation_data = None
    if record.simulation_summary:
        try:
            simulation_data = json.loads(record.simulation_summary)
        except Exception:
            pass

    try:
        pdf_bytes = generate_pdf_report(record_data, simulation_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")

    safe_name = record.filename.split('.')[0]
    filename = f"BrightInt_Report_{safe_name}_{analysis_id[:8]}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
