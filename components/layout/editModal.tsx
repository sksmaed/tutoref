import { TeachingPlan } from "@/types/api";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
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
    const [editedPlan, setEditedPlan] = useState<TeachingPlan>({
        ...plan,
        is_open: Number(plan.is_open)
    });

    useEffect(() => {
        setEditedPlan({
            ...plan,
            is_open: Number(plan.is_open)
        });
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
              .filter(key => key !== 'id')
              .map((key) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium">{key}</label>
                  {key === 'is_open' ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="is_open"
                        checked={editedPlan.is_open === 1}
                        onCheckedChange={(checked) => 
                          handleChange('is_open', checked ? 1 : 0)
                        }
                      />
                      <label htmlFor="is_open" className="text-sm">
                        {editedPlan.is_open === 1 ? '公開' : '不公開'}
                      </label>
                    </div>
                  ) : key === 'objectives' || key === 'outline' ? (
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