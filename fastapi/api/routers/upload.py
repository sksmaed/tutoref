from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..utils.doc_preprocessor import TeachingPlanProcessor
from .. import models
import shutil
import os

router = APIRouter()
processor = TeachingPlanProcessor()

@router.post("/api/upload")
async def upload_teaching_plan(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """上傳並處理教案 PDF"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # 創建臨時檔案
    temp_dir = "temp_files"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    
    try:
        # 儲存上傳的檔案
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 提取文字
        text = processor.extract_pdf_text(temp_path)
        
        # 解析教案內容
        basic_info = processor.parse_teaching_plan(text)

        doc = {
            "semester": basic_info["semester"],
            "category": basic_info["category"],
            "grade": basic_info["grade"],
            "duration": basic_info["duration"],
            "writer_name": basic_info["writer_name"],
            "objectives": basic_info["objectives"],
            "outline": basic_info["outline"],
        }
        
        # 創建教案記錄
        teaching_plan = models.TeachingPlan(**basic_info)
        db.add(teaching_plan)
        db.flush()  # 獲取 ID
        
        # 更新 Elasticsearch
        await request.app.state.es_client.index_teaching_plan(
            teaching_plan_id=str(teaching_plan.id),
            doc=doc
        )
        
        db.commit()
        
        return {
            "message": "Teaching plan uploaded successfully",
            "id": teaching_plan.id
        }
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # 清理臨時檔案
        if os.path.exists(temp_path):
            os.remove(temp_path)