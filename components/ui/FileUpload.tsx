import React, { useState, useRef } from 'react';
import Image from 'next/image';

interface FileUploadProps {
  onFileUpload: (file: File | null) => void;
  isUploading: boolean;
  uploadedFile: File | null;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  isUploading,
  uploadedFile,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0] || null;
    onFileUpload(file);
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // 如果已上傳檔案，顯示附檔預覽
  if (uploadedFile) {
    return (
      <div className={`w-full h-[160px] rounded-lg p-10 gap-2.5 bg-primary-100 flex flex-col items-center justify-center ${className}`}>
        <div className="flex justify-center">
          <Image
            src="/icons/file.png"
            alt="file icon"
            width={28}
            height={28}
          />
        </div>
      
        <div>
          <p className="text-sm font-medium text-black-900">
            {uploadedFile.name}
          </p>
        </div>

        {/* 隱藏的檔案輸入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    );
  }

  // 預設的上傳區域
  return (
    <div 
      className={`
        border-2 border-dashed rounded-lg p-20 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-6
        ${isDragOver ? 'border-primary-900 bg-primary-100' : 'border-black-300 hover:border-primary-900 hover:bg-primary-100/50'}
        ${className}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFileSelector}
    >
      {/* 上傳圖示 */}
      <div className="flex justify-center">
        <Image
          src="/icons/upload.png"
          alt="upload icon"
          width={28}
          height={28}
        />
      </div>

      {/* 文字說明 */}
      <p className="text-base font-medium text-primary-900 max-w-xs break-words text-center">
        請點擊選擇上傳的教案<br />（僅限 PDF 檔）
      </p>

      {/* 隱藏的檔案輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
};
