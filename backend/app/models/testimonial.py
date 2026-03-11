from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class Testimonial(Base):
    __tablename__ = "testimonials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)  # e.g. "Software Engineer at Google"
    quote = Column(Text, nullable=False)
    photo_url = Column(String(500), nullable=True)
    is_featured = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
