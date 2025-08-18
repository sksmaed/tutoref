'use client'

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { TeachingPlan } from '@/types/api';
import EditModal from '@/components/layout/editModal';
import { useToast } from '@/hooks/use-toast';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;


const UploadPage = () => {
  const [parsedPlans, setParsedPlans] = useState<TeachingPlan[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TeachingPlan | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      const filesArray = Array.from(e.target.files);
      filesArray.forEach(file => {
        formData.append('files', file);
      });

      setUploadedFiles(filesArray); // 更新已選擇的檔案清單

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
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">批量上傳教案</h1>

        <div className="mb-8">
          <Input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="mb-4"
          />
          {uploadedFiles.length > 0 && (
            <ul className="mb-4 text-sm text-gray-700">
              {uploadedFiles.map((file, index) => (
                <li key={index}>📂 {file.name}</li>
              ))}
            </ul>
          )}
          {isUploading && (
            <div className="flex items-center space-x-2">
              <Loader2 className="animate-spin" />
              <span>正在解析教案...</span>
            </div>
          )}
        </div>

        {parsedPlans.length > 0 && (
          <>
            <table className="w-full bg-white shadow-md rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border">家別</th>
                  <th className="py-2 px-4 border">期數</th>
                  <th className="py-2 px-4 border">課程類別</th>
                  <th className="py-2 px-4 border">教案名稱</th>
                  <th className="py-2 px-4 border">撰寫者</th>
                  <th className="py-2 px-4 border">編輯</th>
                </tr>
              </thead>
              <tbody>
                {parsedPlans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="py-2 px-4 border text-center">{plan.team}</td>
                    <td className="py-2 px-4 border text-center">{plan.semester}</td>
                    <td className="py-2 px-4 border text-center">{plan.category}</td>
                    <td className="py-2 px-4 border text-center">{plan.tp_name}</td>
                    <td className="py-2 px-4 border text-center">{plan.writer_name}</td>
                    <td className="py-2 px-4 border text-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setIsEditModalOpen(true);
                        }}
                      >
                        編輯
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSubmit}>
                確認上傳
              </Button>
            </div>
          </>
        )}

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
    </div>
  );
};

export default UploadPage;