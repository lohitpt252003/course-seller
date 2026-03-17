from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content_type = Column(String(40), nullable=False, default="text")
    content = Column(Text, nullable=True)
    video_url = Column(String(500), nullable=True)
    pdf_url = Column(String(500), nullable=True)
    ppt_url = Column(String(500), nullable=True)
    code_template = Column(Text, nullable=True)
    quiz_data = Column(Text, nullable=True)
    autograde_tests = Column(Text, nullable=True)
    autograde_language = Column(String(20), nullable=True)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    course = relationship("Course", back_populates="lessons")
    progress = relationship("Progress", back_populates="lesson", cascade="all, delete-orphan")
    submissions = relationship("LessonSubmission", back_populates="lesson", cascade="all, delete-orphan")
