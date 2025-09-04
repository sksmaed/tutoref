'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { TeachingPlan } from '@/types/api';
import EditModal from '@/components/layout/editModal';
import { useToast } from '@/hooks/use-toast';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const UploadPage = () => {
  const [parsedPlans, setParsedPlans] = useState<TeachingPlan[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TeachingPlan | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      setUploadedFile(null);
      setParsedPlans([]);
      return;
    }
    
    setUploadedFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('files', file);

      const response = await fetch(`${BACKEND_URL}/api/upload-file`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setParsedPlans(data);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/submit-plans`, {
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
  };

  return (
    <div className="w-full h-full bg-black-100 flex flex-col items-center pt-[60px]">
      <h1 className="text-[40px] leading-normal font-bold text-black-900 mb-10">上傳教案</h1>
      
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

      {/* 解析結果表格 */}
      {parsedPlans.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-black-900 mb-4">解析結果</h2>
          <table className="w-full">
            <thead className="bg-black-100">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-black-700">家別</th>
                <th className="py-3 px-4 text-left font-medium text-black-700">學期</th>
                <th className="py-3 px-4 text-left font-medium text-black-700">類別</th>
                <th className="py-3 px-4 text-left font-medium text-black-700">教案名稱</th>
                <th className="py-3 px-4 text-left font-medium text-black-700">作者</th>
                <th className="py-3 px-4 text-left font-medium text-black-700">編輯</th>
              </tr>
            </thead>
            <tbody>
              {parsedPlans.map((plan) => (
                <tr key={plan.id} className="border-t border-black-200">
                  <td className="py-3 px-4 text-black-900">{plan.team}</td>
                  <td className="py-3 px-4 text-black-900">{plan.semester}</td>
                  <td className="py-3 px-4 text-black-900">{plan.category}</td>
                  <td className="py-3 px-4 text-black-900">{plan.tp_name}</td>
                  <td className="py-3 px-4 text-black-900">{plan.writer_name}</td>
                  <td className="py-3 px-4">
                    <Button
                      variant="small"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setIsEditModalOpen(true);
                      }}
                      className="bg-primary-900 text-white hover:bg-primary-900/90"
                    >
                      編輯
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 編輯模態框 */}
      {selectedPlan && (
        <EditModal
          plan={selectedPlan}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updatedPlan) => {
            setParsedPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
          }}
        />
      )}
    </div>
  );
};

export default UploadPage;