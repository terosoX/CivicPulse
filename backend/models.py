import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="citizen", nullable=False)  # citizen, admin, officer, field_worker, super_admin
    phone = Column(String, default="")
    ward = Column(String, default="Ward 4 - Central Promenade")
    department = Column(String, default="")
    password_hash = Column(String, nullable=False)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ComplaintModel(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, index=True)
    ticket_number = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    priority = Column(String, default="Medium")
    status = Column(String, default="Submitted")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    address = Column(String, nullable=False)
    ward = Column(String, nullable=False)
    landmark = Column(String, default="")
    image_url = Column(String, default="")
    citizen_id = Column(String, default="user_citizen_1")
    citizen_name = Column(String, default="Aarav Sharma")
    is_anonymous = Column(Boolean, default=False)
    department_assigned = Column(String, default="Roads & Infrastructure")
    officer_assigned = Column(String, default="Eng. Vikram Sethi")
    upvotes = Column(Integer, default=1)
    fake_score = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class DepartmentModel(Base):
    __tablename__ = "departments"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    head_name = Column(String, default="")
    email = Column(String, default="")
    phone = Column(String, default="")
    active_tickets = Column(Integer, default=0)
    resolved_tickets = Column(Integer, default=0)
    avg_resolution_hours = Column(Float, default=24.0)

class WardModel(Base):
    __tablename__ = "wards"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    ward_number = Column(Integer, default=1)
    councilor_name = Column(String, default="")
    total_complaints = Column(Integer, default=0)
    resolved_complaints = Column(Integer, default=0)

class AnnouncementModel(Base):
    __tablename__ = "announcements"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    department = Column(String, default="General Municipal Administration")
    priority = Column(String, default="Normal")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class FeedbackModel(Base):
    __tablename__ = "feedbacks"

    id = Column(String, primary_key=True, index=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comments = Column(Text, default="")
    citizen_name = Column(String, default="Citizen")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
