'use client'

import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import TeachingPlanEditor from '@/features/teaching-plan/TeachingPlanEditor';
import TeachingPlanPreview from '@/features/teaching-plan/TeachingPlanPreview';
import UploadDropzone from '@/features/upload/UploadDropzone';
import { useUploadFlow } from '@/features/upload/useUploadFlow';

/**
 * 上傳教案頁（薄路由層）：流程狀態集中在 useUploadFlow，
 * 三個階段（選檔 / 預覽 / 編輯）依狀態切換。
 */
const UploadPage = () => {
  const {
    isUploading,
    uploadedFile,
    showPreview,
    showEditor,
    isValid,
    showCancelConfirm,
    showErrorModal,
    setShowErrorModal,
    currentPlan,
    editorRef,
    handleFileUpload,
    handleSubmit,
    handleEditorSave,
    handleValidationChange,
    handleEditorCancel,
    handleConfirmCancel,
    handleContinueEditing,
    handlePreviewEdit,
    handleSlideFileSelect,
    handlePreviewConfirm,
  } = useUploadFlow();

  return (
    <div className="w-full h-full bg-black-100 flex flex-col items-center pt-8 sm:pt-[60px] px-4 sm:px-0">
      <h1 className="text-[28px] sm:text-[40px] leading-normal font-bold text-black-900 mb-6 sm:mb-10">上傳教案</h1>

      {!showPreview && !showEditor ? (
        <UploadDropzone
          uploadedFile={uploadedFile}
          isUploading={isUploading}
          onFileUpload={handleFileUpload}
          onSubmit={handleSubmit}
        />
      ) : showPreview ? (
        /* 預覽表格 */
        <>
          {currentPlan && (
            <TeachingPlanPreview
              plan={currentPlan}
            />
          )}

          {/* 預覽頁按鈕 */}
          <div className="w-full flex justify-center gap-2.5 mt-10">
            <Button
              variant="small"
              onClick={handlePreviewEdit}
              disabled={isUploading}
              className="text-base leading-normal bg-white border border-primary-900 text-primary-900"
            >
              編輯內容
            </Button>
            <Button
              variant="small"
              onClick={handlePreviewConfirm}
              disabled={isUploading}
              className="text-base leading-normal bg-primary-900 text-white font-bold"
            >
              確認上傳
            </Button>
          </div>
        </>
      ) : (
        /* 編輯表格 */
        <>
          <p className="text-base sm:text-xl leading-normal text-black-900 text-center mb-8">
            以下資訊為系統自動辨識檔案內容產生，供大家在檢索結果中預覽，現在你可以修改內容囉！
          </p>
          {currentPlan && (
            <TeachingPlanEditor
              ref={editorRef}
              plan={currentPlan}
              onSave={handleEditorSave}
              onCancel={handleEditorCancel}
              onValidationChange={handleValidationChange}
              onSlideFileSelect={handleSlideFileSelect}
            />
          )}

          {/* 編輯頁按鈕 */}
          <div className="w-full flex justify-center gap-2.5 mt-10">
            <Button
              variant="small"
              onClick={handleEditorCancel}
              className="text-base leading-normal bg-white border border-primary-900 text-primary-900"
            >
              取消編輯
            </Button>
            <Button
              variant="small"
              onClick={() => editorRef.current?.save()}
              disabled={!isValid || isUploading}
              className={`text-base leading-normal font-bold ${
                isValid && !isUploading
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
