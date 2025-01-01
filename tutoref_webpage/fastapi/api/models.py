from sqlalchemy import Column, Integer, String
from .database import Base

class TeachingPlan(Base):
    __tablename__ = 'teahcing_plan'
    tp_name = Column(String, primary_key=True, index=True)
    writer_name = Column(String, primary_key=True, index=True)
    team = Column(String)
    semester = Column(String)
    category = Column(String)
    grade = Column(String)
    duration = Column(Integer)
    staffing = Column(String)
    venue = Column(String)
    objectives = Column(String)
    outline = Column(String)
    sheet_docx = Column(String)
    sheet_pdf = Column(String)
    slide_pptx = Column(String)
    slide_pdf = Column(String)
    
class Admin(Base):
    __tablename__ = 'admin'
    admin_name = Column(String, primary_key=True)
    hashed_password=Column(String, unique=True)
    