import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TeachingPlan } from '../../types/api';
import { DURATION_MAP, SEMESTER_MAP } from '@/lib/constant';

interface LessonPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonData: TeachingPlan | null;
}

const LessonPlanModal: React.FC<LessonPlanModalProps> = ({
  isOpen,
  onClose,
  lessonData
}) => {
  if (!isOpen || !lessonData) return null;

  const renderTextWithLineBreaks = (text: string) => {
    const formattedText = text.replace(/\n/g, '<br />');
    return { __html: formattedText };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">課程詳細資訊</DialogTitle>
        </DialogHeader>
        
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse bg-white">
            <tbody>
              <tr>
                <td className="border px-4 py-2 bg-gray-50 text-center font-medium">家別</td>
                <td className="border px-4 py-2 text-center">{lessonData.team}</td>
                <td className="border px-4 py-2 bg-gray-50 text-center font-medium">期數</td>
                <td className="border px-4 py-2 text-center">{SEMESTER_MAP[lessonData.semester] || `${lessonData.semester}`}</td>
                <td className="border px-4 py-2 bg-gray-50 text-center font-medium">撰寫者</td>
                <td className="border px-4 py-2 text-center">{lessonData.writer_name}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 bg-gray-50 text-center font-medium">課程類別</td>
                <td className="border px-4 py-2 text-center">{lessonData.category}</td>
                <td className="border px-4 py-2 bg-gray-50 text-center font-medium">課程名稱</td>
                <td className="border px-4 py-2 text-center" colSpan={3}>{lessonData.tp_name}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 bg-gray-50 text-center font-medium">適用年級</td>
                <td className="border px-4 py-2 text-center">{lessonData.grade}</td>
                <td className="border px-4 py-2 bg-gray-50 text-center font-medium">課程時長</td>
                <td className="border px-4 py-2 text-center" colSpan={3}>{DURATION_MAP[lessonData.duration] || `${lessonData.duration}分鐘`}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 bg-gray-50 text-center font-medium">課程所需場地</td>
                <td className="border px-4 py-2 text-center">{lessonData.venue}</td>
                <td className="border px-4 py-2 bg-gray-50 text-center font-medium">課程所需人力</td>
                <td className="border px-4 py-2 text-center" colSpan={3}>{lessonData.staffing}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 bg-gray-50 text-center font-medium" colSpan={6}>課程目標</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 text-center" colSpan={6}>
                  <div dangerouslySetInnerHTML={renderTextWithLineBreaks(lessonData.objectives)} />
                </td>
              </tr>
              <tr>
                <td className="border px-4 py-2 bg-gray-50 text-center font-medium" colSpan={6}>課程大綱</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 text-center" colSpan={6}>
                  <div dangerouslySetInnerHTML={renderTextWithLineBreaks(lessonData.outline)} />
                </td>
              </tr>
              <tr>
                <td className="border px-4 py-2 bg-gray-50 text-center font-medium" colSpan={6}>載點</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 text-center w-1/6">教案紙</td>
                <td className="border px-4 py-2 text-center w-1/6">
                  <a
                    href={lessonData.sheet_docx}
                    download
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    docx檔
                  </a>
                </td>
                <td className="border px-4 py-2 text-center w-1/6">
                <a
                    href={lessonData.sheet_pdf}
                    download
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    pdf檔
                  </a>
                </td>
                <td className="border px-4 py-2 text-center w-1/6">投影片</td>
                <td className="border px-4 py-2 text-center w-1/6">
                  <a
                    href={lessonData.slide_pptx}
                    download
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    pptx檔
                  </a>
                </td>
                <td className="border px-4 py-2 text-center w-1/6">
                <a
                    href={lessonData.slide_pdf}
                    download
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    pdf檔
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonPlanModal;