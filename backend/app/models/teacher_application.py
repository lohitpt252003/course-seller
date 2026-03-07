from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class TeacherApplication(Base):
    __tablename__ = "teacher_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requirements = Column(Text, nullable=False)
    cv = Column(Text, nullable=False)
    cv_url = Column(String(500), nullable=True)  # URL to uploaded PDF resume
    course_description = Column(Text, nullable=False)
    course_overview = Column(Text, nullable=False)
    expected_lectures = Column(Integer, nullable=False)
    demo_video_url = Column(String(500), nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending, approved, rejected
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    applicant = relationship("User", backref="teacher_applications")
