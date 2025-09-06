import { TeachingPlan } from "@/types/api";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
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

  const handleChange = (field: keyof TeachingPlan, value: string | number) => {
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
            .filter(key => key !== 'id' && key !== 'is_open')
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
                    placeholder={`請輸入 ${key}`}
                    value={editedPlan[key as keyof TeachingPlan] as string}
                    onChange={(value) => handleChange(key as keyof TeachingPlan, value)}
                  />
                )}
              </div>
            ))}
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="small" onClick={onClose}>
            取消
          </Button>
          <Button variant="small" onClick={handleSave}>
            儲存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditModal;