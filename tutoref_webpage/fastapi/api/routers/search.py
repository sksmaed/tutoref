from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import TeachingPlan

router = APIRouter()

@router.get("/search")
def search_teaching_plans(db: Session = Depends(get_db)):
    plans = db.query(TeachingPlan).all()
    return {"data": plans}
