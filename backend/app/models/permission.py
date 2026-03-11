from sqlalchemy import Column, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class ManagerPermission(Base):
    __tablename__ = "manager_permissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    can_manage_users = Column(Boolean, default=False)
    can_manage_courses = Column(Boolean, default=False)
    can_manage_categories = Column(Boolean, default=False)
    can_manage_applications = Column(Boolean, default=False)
    can_manage_coupons = Column(Boolean, default=False)

    user = relationship("User", back_populates="permissions")
