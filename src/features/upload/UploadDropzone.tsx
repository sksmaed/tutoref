'use client';

import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';

interface UploadDropzoneProps {
  uploadedFile: File | null;
  isUploading: boolean;
  onFileUpload: (file: File | null) => void;
  onSubmit: () => void;
  submitLabel?: string;
  uploadingLabel?: string;
}

/** 上傳卡片：選擇檔案 + 載入狀態 + 重新選擇／確認上傳按鈕。 */
export default function UploadDropzone({
  uploadedFile,
  isUploading,
  onFileUpload,
  onSubmit,
  submitLabel = '確認上傳',
  uploadingLabel = '正在上傳教案...',
}: UploadDropzoneProps) {
  return (
    <div className={`w-full sm:w-[576px] flex flex-col bg-white rounded-xl sm:rounded-lg px-6 sm:px-[100px] py-10 sm:py-20`}>
      <FileUpload
        onFileUpload={onFileUpload}
        isUploading={isUploading}
        uploadedFile={uploadedFile}
      />

      {/* 載入狀態 */}
      {isUploading && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-primary-900">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-900 border-t-transparent"></div>
            <span>{uploadingLabel}</span>
          </div>
        </div>
      )}

      {/* 按鈕區域 */}
      <div className="flex flex-col gap-3 mt-8">
        {/* 重新選擇檔案按鈕 - 只在有檔案時顯示 */}
        {uploadedFile && (
          <div className="flex justify-center">
            <Button
              onClick={() => onFileUpload(null)}
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
            onClick={onSubmit}
            disabled={!uploadedFile || isUploading}
            variant="large"
            className={`
              ${!uploadedFile ? 'bg-black-300 text-black-500 cursor-not-allowed' : 'bg-primary-900 text-white hover:bg-primary-900/90'}
            `}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
