import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

interface SlideUploadProps {
  initialFileName?: string;
  onFileChange: (fileName: string) => void;
  onFileRemove: () => void;
  onFileSelect?: (file: File | null) => void;
}

const SlideUpload: React.FC<SlideUploadProps> = ({
  initialFileName = '',
  onFileChange,
  onFileRemove,
  onFileSelect,
}) => {
  const [currentFileName, setCurrentFileName] = useState<string>(initialFileName);

  // 當 initialFileName 改變時同步
  useEffect(() => {
    setCurrentFileName(initialFileName);
  }, [initialFileName]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCurrentFileName(file.name);
      onFileChange(file.name);
      onFileSelect?.(file);
    }
    // 重置 input 的值，以便同一個檔案可以再次被選擇
    event.target.value = '';
  };

  const handleRemoveFile = () => {
    setCurrentFileName('');
    onFileRemove();
    onFileSelect?.(null);
  };

  return (
    <div className="space-y-3">
      {currentFileName ? (
        <div className="flex flex-col justify-between p-3 bg-gray-50 rounded gap-3">
          <div className="flex gap-2">
            <Image
              src="/icons/file-alt.png"
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
              leftIcon="/icons/upload.png"
            >
              重新選擇檔案
            </Button>
            <Button
              variant="default"
              className="border border-black-900 text-black-900 text-sm"
              onClick={handleRemoveFile}
              leftIcon="/icons/trash.png"
            >
              刪除已選檔案
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-base text-black-900 leading-normal mb-3">
            如果你願意跟大家分享課程投影片，那就太好了！（僅限 PDF 檔）
          </p>
          <Button
            variant="default"
            className="bg-white border border-primary-900 text-primary-900 text-sm"
            onClick={() => document.getElementById('slide-upload')?.click()}
            leftIcon="/icons/upload.png"
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
  );
};

export default SlideUpload;
