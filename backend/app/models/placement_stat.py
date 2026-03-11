from sqlalchemy import Column, Integer, String
from app.database import Base

class PlacementStat(Base):
    __tablename__ = "placement_stats"

    # Single row enforcement (we only ever need one placement stats config row)
    id = Column(Integer, primary_key=True, default=1)
    
    highest_package = Column(String(50), nullable=False, default="0 LPA")
    average_package = Column(String(50), nullable=False, default="0 LPA")
    placement_percentage = Column(String(20), nullable=False, default="0%")
    total_hiring_partners = Column(Integer, nullable=False, default=0)
