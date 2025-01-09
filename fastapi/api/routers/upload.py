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
        basic_info, procedure_content = processor.parse_teaching_plan(text)
        
        # 生成 embeddings
        embeddings = processor.generate_embeddings(procedure_content)
        
        # 創建教案記錄
        teaching_plan = models.TeachingPlan(**basic_info)
        db.add(teaching_plan)
        db.flush()  # 獲取 ID
        
        # 創建搜索內容記錄
        search_content = models.SearchContent(
            teaching_plan_id=teaching_plan.id,
            content=procedure_content
        )
        db.add(search_content)
        
        # 更新 Elasticsearch
        await request.app.state.es_client.index_teaching_plan(
            teaching_plan=teaching_plan.__dict__,
            search_content={"content": procedure_content},
            embeddings_data=embeddings
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