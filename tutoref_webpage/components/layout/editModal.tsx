import { TeachingPlan } from "@/types/api";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogHeader } from "../ui/dialog";
import { useState, useEffect } from "react";

const EditModal = ({ 
    plan, 
    isOpen, 
    onClose,
    onSave
}: { 
    plan: TeachingPlan, 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (updatedPlan: TeachingPlan) => void 
}) => {
    const [editedPlan, setEditedPlan] = useState<TeachingPlan>(plan);

    useEffect(() => {
        setEditedPlan(plan);
    }, [plan]);

    const handleChange = (field: keyof TeachingPlan, value: string) => {
        setEditedPlan(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(editedPlan);
        onClose();
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>編輯教案資訊</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(plan)
              .filter(key => key !== 'id') // 排除 id
              .map((key) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium">{key}</label>
                  {key === 'objectives' || key === 'outline' ? (
                    <textarea
                      className="w-full p-2 border rounded-md"
                      value={editedPlan[key as keyof TeachingPlan] as string}
                      onChange={e => handleChange(key as keyof TeachingPlan, e.target.value)}
                      rows={4}
                    />
                  ) : (
                    <Input 
                      value={editedPlan[key as keyof TeachingPlan] as string} 
                      onChange={e => handleChange(key as keyof TeachingPlan, e.target.value)}
                    />
                  )}
                </div>
              ))}
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSave}>
              儲存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
};

export default EditModal;