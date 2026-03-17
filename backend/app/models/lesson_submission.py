from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class LessonSubmission(Base):
    __tablename__ = "lesson_submissions"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    submission_type = Column(String(30), nullable=False)
    answer_data = Column(Text, nullable=True)
    submission_text = Column(Text, nullable=True)
    submission_code = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="submitted")
    score = Column(Float, nullable=True)
    max_score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    graded_at = Column(DateTime(timezone=True), nullable=True)

    lesson = relationship("Lesson", back_populates="submissions")
    user = relationship("User")
