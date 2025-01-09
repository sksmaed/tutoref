from fastapi import APIRouter, Depends, HTTPException, Request
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
async def search_teaching_plans(
    request: Request,
    filters: SearchFilters,
    db: Session = Depends(get_db)
):
    try:
        # 構建 ES 搜尋查詢
        es_query = {
            "bool": {
                "must": [],
                "filter": []
            }
        }
        
        # 添加關鍵字搜尋
        if filters.keyword:
            es_query["bool"]["must"].append({
                "multi_match": {
                    "query": filters.keyword,
                    "fields": ["tp_name", "content"]
                }
            })
        
        # 添加過濾條件
        for field in ["semester", "category", "grade"]:
            if getattr(filters, field):
                es_query["bool"]["filter"].append({
                    "terms": {field: getattr(filters, field)}
                })
        
        # 執行 ES 搜尋
        es_results = await request.app.state.es_client.search(
            {"query": es_query}
        )
        
        # 獲取結果 ID 和分數
        result_ids = []
        scores = {}
        for hit in es_results["hits"]["hits"]:
            result_id = int(hit["_id"].split("_")[0])
            result_ids.append(result_id)
            scores[result_id] = hit["_score"]
        
        # 從資料庫獲取完整資料
        teaching_plans = db.query(TeachingPlan).filter(
            TeachingPlan.id.in_(result_ids)
        ).all()
        
        print(scores)
        # 更新相似度分數
        for plan in teaching_plans:
            if plan.search_content:
                plan.search_content.similarity_score = scores.get(plan.id)
        
        return {
            "status": "success",
            "data": [plan for plan in teaching_plans],
            "count": len(teaching_plans)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))