from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from ..database import get_db
from ..models import TeachingPlan
from pydantic import BaseModel

router = APIRouter()

class SearchFilters(BaseModel):
    semester: List[str] = []
    category: List[str] = []
    duration: List[str] = []
    grade: List[str] = []
    keyword: Optional[str] = None
    writer_name: Optional[str] = None

@router.post("/api/search")
def search_teaching_plans(
    filters: SearchFilters,
    db: Session = Depends(get_db)
):
    query = db.query(TeachingPlan)

    # 套用篩選條件
    if filters.semester:
        query = query.filter(TeachingPlan.semester.in_(filters.semester))
    
    if filters.category:
        query = query.filter(TeachingPlan.category.in_(filters.category))
    
    if filters.duration:
        query = query.filter(TeachingPlan.duration.in_(filters.duration))
    
    if filters.grade:
        query = query.filter(TeachingPlan.grade.in_(filters.grade))

    # 關鍵字搜尋
    if filters.keyword:
        query = query.filter(
            or_(
                TeachingPlan.tp_name.ilike(f"%{filters.keyword}%"),
                TeachingPlan.outline.ilike(f"%{filters.keyword}%"),
                TeachingPlan.objectives.ilike(f"%{filters.keyword}%")
            )
        )

    # 作者搜尋
    if filters.writer_name:
        query = query.filter(TeachingPlan.writer_name.ilike(f"%{filters.writer_name}%"))

    try:
        results = query.all()
        return {
            "status": "success",
            "data": [
                {
                    "id": plan.id,
                    "team": plan.team,
                    "semester": plan.semester,
                    "writer_name": plan.writer_name,
                    "category": plan.category,
                    "tp_name": plan.tp_name,
                    "grade": plan.grade,
                    "duration": plan.duration,
                    "staffing": plan.staffing,
                    "venue": plan.venue,
                    "objectives": plan.objectives,
                    "outline": plan.outline,
                    "sheet_docx": plan.sheet_docx,
                    "sheet_pdf": plan.sheet_pdf,
                    "slide_pptx": plan.slide_pptx,
                    "slide_pdf": plan.slide_pdf,
                }
                for plan in results
            ],
            "count": len(results)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )