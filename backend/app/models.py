import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Text, DateTime
from .database import Base

class AnalysisRecord(Base):
    __tablename__ = "analysis_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    total_pixels = Column(Integer, nullable=False)
    total_brightness = Column(Float, nullable=False)
    average_brightness = Column(Float, nullable=False)
    normalized_average = Column(Float, nullable=False)
    min_brightness = Column(Float, nullable=False)
    max_brightness = Column(Float, nullable=False)
    thumbnail_base64 = Column(Text, nullable=True)
    histogram_json = Column(Text, nullable=True) # JSON list of 256 frequency counts
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    simulation_summary = Column(Text, nullable=True) # Optional summary if simulation performed

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "width": self.width,
            "height": self.height,
            "total_pixels": self.total_pixels,
            "total_brightness": self.total_brightness,
            "average_brightness": self.average_brightness,
            "normalized_average": self.normalized_average,
            "min_brightness": self.min_brightness,
            "max_brightness": self.max_brightness,
            "thumbnail_base64": self.thumbnail_base64,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "simulation_summary": self.simulation_summary
        }
