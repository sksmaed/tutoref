import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import TeachingPlan
from pydantic import BaseModel

router = APIRouter()

class SearchFilters(BaseModel):
    semester: List[str] = []
    category: List[str] = []
    grade: List[str] = []
    duration: List[int] = []
    keyword: Optional[str] = None
    writer_name: Optional[str] = None

@router.post("/api/search")
async def search_teaching_plans(
    request: Request,
    filters: SearchFilters,
    db: Session = Depends(get_db)
):
    try:
        # 準備過濾條件
        query = filters.keyword if filters.keyword else ""
            
        filter_params = {}
        for field in ["semester", "category", "grade", "duration"]:
            if values := getattr(filters, field):
                if values:  # 確保列表不為空
                    filter_params[field] = values
        
        # 執行 ES 搜尋
        es_results = await request.app.state.es_client.search(
            query=query,
            writer_name=filters.writer_name,  # 傳遞作者名稱
            filters=filter_params if filter_params else None
        )
        
        # 處理搜尋結果
        result_ids = []
        scores = {}
        print(es_results)
        if es_results:
            for hit in es_results["hits"]:
                if hit["_score"] > 0.5:
                    result_id = int(hit["_id"].split("_")[0])
                    result_ids.append(result_id)
                    scores[result_id] = hit["_score"]
        
        # 從資料庫獲取完整資料
        if result_ids:
            teaching_plans = db.query(TeachingPlan).filter(
                TeachingPlan.id.in_(list(set(result_ids)))
            ).all()
            
            return {
                "status": "success",
                "data": teaching_plans,
                "count": len(teaching_plans),
                "total_hits": es_results["total"]["value"]
            }
        
        return {
            "status": "success",
            "data": [],
            "count": 0,
            "total_hits": 0
        }
        
    except Exception as e:
        logging.error(f"Search error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"搜尋過程發生錯誤: {str(e)}"
        )