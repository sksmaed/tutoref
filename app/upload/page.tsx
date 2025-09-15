'use client'

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { TeachingPlan } from '@/types/api';
import EditModal from '@/components/layout/editModal';
import TeachingPlanEditor, { TeachingPlanEditorRef } from '@/components/layout/TeachingPlanEditor';
import TeachingPlanPreview from '@/components/layout/TeachingPlanPreview';
import { useToast } from '@/hooks/use-toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const UploadPage = () => {
  // 模擬教案資料
  const mockTeachingPlan: TeachingPlan = {
    id: 1,
    team: "霧鹿",
    semester: "25冬",
    writer_name: "林玉芝、對民宇",
    category: "社會",
    tp_name: "「免」「象」已見-認識台灣原住民的故事",
    grade: "中高年級",
    duration: "大堂課 (90 分鐘)",
    objectives: "1. 引起：學會語言與知識的心態、教師民主化，以促其建構課程經法師者的能力。\n2. 發展：學會語言表達原的表達規定言，並運用和智慧且常用的法法國書法。\n3. 技能：幫習習語言表達原的的法法規範、並請持練出並會的高學的活，觀評估持續性的觀測及反思。",
    outline: "1. 蘇活語詞彙的詞義系用好：介純電的表作詞的的方詞，以及此確果對現對想蘇語蘇詞的的規配。\n2. 口語表達：演以及詞的演技用詞中後想分分和蘇法師蘇想不現語義錄詞的詞。\n3. 分析和增上者上這語的分想：以及語民詞的高常和發系和的分想配配想一些少話組少會選擇些。\n4. 蘇作等語言民平：先學好蘇語的表法，表法法性評法的原法法和發及經次語法法的滿意。",
    completion_notes: "1. 學生對於原住民文化展現出濃厚興趣，課堂參與度很高。\n2. 建議下次可以增加更多互動環節，讓學生更深入理解原住民的生活方式。\n3. 需要加強對台灣原住民族群分布的地理位置教學，學生對此概念較模糊。",
    slide_pdf: "",
  };

  const [parsedPlans, setParsedPlans] = useState<TeachingPlan[]>([mockTeachingPlan]);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(true); // 顯示預覽表格
  const [showEditor, setShowEditor] = useState(false); // 顯示編輯表格
  const [isValid, setIsValid] = useState(true); // 新增驗證狀態
  const [showCancelConfirm, setShowCancelConfirm] = useState(false); // 顯示取消編輯確認對話框
  const [showErrorModal, setShowErrorModal] = useState(false); // 顯示檔案格式錯誤 modal
  const [persistentSlideFile, setPersistentSlideFile] = useState<string>(mockTeachingPlan.slide_pdf || ''); // 持久化的slide檔案名稱
  const [preEditSlideFile, setPreEditSlideFile] = useState<string>(''); // 編輯前的slide檔案狀態，用於取消編輯時恢復
  const editorRef = useRef<TeachingPlanEditorRef>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      setUploadedFile(null);
      setParsedPlans([]);
      setShowPreview(false);
      setShowEditor(false);
      return;
    }
    
    setUploadedFile(file);
  };

  const handleSubmit = async () => {
    // 檢查檔案類型
    if (!uploadedFile) return;
    
    // 檢查是否為 PDF 檔案
    if (uploadedFile.type !== 'application/pdf' && !uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      setShowErrorModal(true);
      return;
    }

    // 如果檔案格式正確，開始上傳並解析
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('files', uploadedFile);

      const response = await fetch(`${BACKEND_URL}/api/teaching-plan/upload-files`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setParsedPlans(data);
      
      // 重置slide檔案狀態為新解析結果的狀態
      if (data && data.length > 0) {
        setPersistentSlideFile(data[0].slide_pdf || '');
        setShowPreview(true);
        setShowEditor(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "❌ 上傳失敗",
        description: "請稍後再試。",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!showEditor) {
      // 如果還沒顯示編輯表格，先提交教案資料到後端
      try {
        const response = await fetch(`${BACKEND_URL}/api/teaching-plan/submit-plans`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsedPlans),
        });

        if (!response.ok) {
          throw new Error("Failed to submit teaching plans");
        }

        toast({
          title: "✅ 提交成功",
          description: "教案已成功提交到系統。",
          variant: "default",
        });
      } catch (error) {
        console.error("Submit error:", error);
        toast({
          title: "❌ 提交失敗",
          description: "請稍後再試。",
          variant: "destructive",
        });
      }
    } else {
      // 如果已經顯示編輯表格，則提交教案資料
      try {
        const response = await fetch(`${BACKEND_URL}/api/teaching-plan/submit-plans`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsedPlans),
        });

        if (!response.ok) {
          throw new Error("Failed to submit teaching plans");
        }

        toast({
          title: "✅ 提交成功",
          description: "教案已成功提交到系統。",
          variant: "default",
        });
      } catch (error) {
        console.error("Submit error:", error);
        toast({
          title: "❌ 提交失敗",
          description: "請稍後再試。",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditorSave = (updatedPlan: TeachingPlan) => {
    // 保存slide檔案狀態
    setPersistentSlideFile(updatedPlan.slide_pdf || '');
    setParsedPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    setShowEditor(false);
    setShowPreview(true);
  };

  const handleValidationChange = (valid: boolean) => {
    setIsValid(valid);
  };

  const handleEditorCancel = () => {
    console.log('handleEditorCancel - 被調用');
    console.log('handleEditorCancel - 當前 persistentSlideFile:', persistentSlideFile);
    console.log('handleEditorCancel - 當前 preEditSlideFile:', preEditSlideFile);
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    // 恢復到編輯前的slide檔案狀態
    console.log('handleConfirmCancel - 恢復編輯前狀態:', preEditSlideFile);
    console.log('handleConfirmCancel - 當前狀態:', persistentSlideFile);
    setPersistentSlideFile(preEditSlideFile);
    setShowEditor(false);
    setShowPreview(true);
    setShowCancelConfirm(false);
  };

  const handleContinueEditing = () => {
    setShowCancelConfirm(false);
  };

  const handlePreviewEdit = () => {
    // 保存編輯前的slide檔案狀態
    console.log('handlePreviewEdit - 保存編輯前狀態:', persistentSlideFile);
    setPreEditSlideFile(persistentSlideFile);
    setShowPreview(false);
    setShowEditor(true);
  };

  const handlePreviewReset = () => {
    setShowPreview(false);
    setShowEditor(false);
    setUploadedFile(null);
    setParsedPlans([]);
  };

  const handlePreviewConfirm = async () => {
    await handleSubmit();
  };

  return (
    <div className="w-full h-full bg-black-100 flex flex-col items-center pt-[60px]">
      <h1 className="text-[40px] leading-normal font-bold text-black-900 mb-10">上傳教案</h1>
      
      {!showPreview && !showEditor ? (
        <>
          {/* 上傳卡片 */}
          <div className={`w-[576px] flex flex-col bg-white rounded-lg px-[100px] py-20`}>
            {/* 使用新的 FileUpload 元件 */}
            <FileUpload
              onFileUpload={handleFileUpload}
              isUploading={isUploading}
              uploadedFile={uploadedFile}
            />

            {/* 載入狀態 */}
            {isUploading && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center space-x-2 text-primary-900">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-900 border-t-transparent"></div>
                  <span>正在上傳教案...</span>
                </div>
              </div>
            )}
            
            {/* 按鈕區域 */}
            <div className="flex flex-col gap-3 mt-8">
              {/* 重新選擇檔案按鈕 - 只在有檔案時顯示 */}
              {uploadedFile && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => handleFileUpload(null)}
                    variant="large"
                    disabled={isUploading}
                    className="text-sm bg-white border border-primary-900 text-primary-900 hover:bg-primary-50"
                  >
                    重新選擇檔案
                  </Button>
                </div>
              )}

              {/* 確認上傳按鈕*/}
              <div className="flex justify-center">
                <Button 
                  onClick={handleSubmit}
                  disabled={!uploadedFile || isUploading}
                  variant="large"
                  className={`
                    ${!uploadedFile ? 'bg-black-300 text-black-500 cursor-not-allowed' : 'bg-primary-900 text-white hover:bg-primary-900/90'}
                  `}
                >
                  確認上傳
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : showPreview ? (
        /* 預覽表格 */
        <>
          {parsedPlans.length > 0 && (
            <TeachingPlanPreview 
              plan={{...parsedPlans[0], slide_pdf: persistentSlideFile}}
            />
          )}
          
          {/* 預覽頁按鈕 */}
          <div className="w-full flex justify-center gap-2.5 mt-10">
            <Button
              variant="small"
              onClick={handlePreviewEdit}
              className="text-base leading-[1.5] bg-white border border-primary-900 text-primary-900"
            >
              編輯內容
            </Button>
            <Button
              variant="small"
              onClick={handlePreviewConfirm}
              className="text-base leading-[1.5] bg-primary-900 text-white font-bold"
            >
              確認上傳
            </Button>
          </div>
        </>
      ) : (
        /* 編輯表格 */
        <>
          {parsedPlans.length > 0 && (
            <TeachingPlanEditor
              ref={editorRef}
              plan={{...parsedPlans[0], slide_pdf: persistentSlideFile}}
              onSave={handleEditorSave}
              onCancel={handleEditorCancel}
              onValidationChange={handleValidationChange}
            />
          )}
          
          {/* 編輯頁按鈕 */}
          <div className="w-full flex justify-center gap-2.5 mt-10">
            <Button
              variant="small"
              onClick={handleEditorCancel}
              className="text-base leading-[1.5] bg-white border border-primary-900 text-primary-900"
            >
              取消編輯
            </Button>
            <Button
              variant="small"
              onClick={() => editorRef.current?.save()}
              disabled={!isValid}
              className={`text-base leading-[1.5] font-bold ${
                isValid 
                  ? 'bg-primary-900 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              編輯完成
            </Button>
          </div>
        </>
      )}

      {/* 取消編輯確認對話框 */}
      <ConfirmModal
        open={showCancelConfirm}
        title="你確定要取消編輯嗎？"
        description="剛剛所做之變更將不會被保存。"
        cancelText="取消編輯"
        confirmText="繼續編輯"
        onClose={handleContinueEditing}
        onCancel={handleConfirmCancel}
        onConfirm={handleContinueEditing}
      />

      {/* 檔案格式錯誤 Modal */}
      <Modal
        open={showErrorModal}
        description="所選檔案格式不符，請重新上傳！"
        confirmText="我知道了"
        onClose={() => setShowErrorModal(false)}
      />
    </div>
  );
};

export default UploadPage;