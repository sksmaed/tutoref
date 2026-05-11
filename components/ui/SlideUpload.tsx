import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/toast';
import { Flash } from '@/utils/flash';

interface SlideUploadProps {
  initialFileName?: string;
  selectedFileName?: string;
  // 允許傳入 null 表示移除檔案
  onFileChange: (fileName: string | null) => void;
  onFileRemove: () => void;
  onFileSelect?: (file: File | null) => void;
}

const SlideUpload: React.FC<SlideUploadProps> = ({
  initialFileName = '',
  selectedFileName,
  onFileChange,
  onFileRemove,
  onFileSelect,
}) => {
  const [currentFileName, setCurrentFileName] = useState<string>(selectedFileName || initialFileName || '');
  const [toast, setToast] = useState<Flash | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  // 當 initialFileName 改變時同步
  useEffect(() => {
    setCurrentFileName(selectedFileName || initialFileName || '');
  }, [initialFileName, selectedFileName]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 檢查檔案大小是否超過 500MB
      const maxSize = 500 * 1024 * 1024;
      if (file.size > maxSize) {
        setToast({
          type: 'error',
          title: '檔案大小超過限制',
          message: '檔案大小超過 500MB 限制，請選擇較小的檔案。',
          timeout: 5000,
        });
        setToastOpen(true);
        // 重置 input 的值
        event.target.value = '';
        return;
      }

      // 立即更新本地狀態以提供即時反饋
      setCurrentFileName(file.name);
      // 同時通知父組件
      onFileChange(file.name);
      onFileSelect?.(file);
    }
    // 重置 input 的值，以便同一個檔案可以再次被選擇
    event.target.value = '';
  };

  const handleRemoveFile = () => {
    // 立即更新本地狀態以提供即時反饋
    setCurrentFileName('');
    onFileChange(null);
    onFileRemove();
    onFileSelect?.(null);
  };

  return (
    <>
      <div className="space-y-3">
        {currentFileName ? (
          <div className="flex flex-col justify-between p-3 bg-gray-50 rounded gap-3">
            <div className="flex gap-2">
              <img
                src="/icons/file-alt.svg"
                alt="file icon"
                width={20}
                height={20}
                className="object-contain"
              />
              <span className="text-base text-black-900">
                  {currentFileName}
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="default"
                className="bg-white border border-primary-900 text-primary-900 text-sm"
                onClick={() => document.getElementById('slide-upload')?.click()}
                leftIcon="/icons/upload.svg"
              >
                重新選擇檔案
              </Button>
              <Button
                variant="default"
                className="border border-black-900 text-black-900 text-sm"
                onClick={handleRemoveFile}
                leftIcon="/icons/trash.svg"
              >
                刪除已選檔案
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-base text-black-900 leading-normal mb-3">
              如果你願意跟大家分享課程投影片，那就太好了！（僅限 PDF 檔，檔案大小不超過 500MB）
            </p>
            <Button
              variant="default"
              className="bg-white border border-primary-900 text-primary-900 text-sm"
              onClick={() => document.getElementById('slide-upload')?.click()}
              leftIcon="/icons/upload.svg"
            >
              選擇檔案
            </Button>
          </div>
        )}
        <input
          id="slide-upload"
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
      
      <Toast
        open={toastOpen && !!toast}
        type={toast?.type}
        title={toast?.title ?? ''}
        message={toast?.message}
        timeout={toast?.timeout ?? 5000}
        onClose={() => setToastOpen(false)}
      />
    </>
  );
};

export default SlideUpload;
