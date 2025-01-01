import React, { useState } from 'react';
import { FilterOptions } from '../../types/filter';
import LessonPlanModal from './LessonPlanModal';

interface ResultTableProps {
  filters: FilterOptions;
}

const ResultTable: React.FC<ResultTableProps> = ({ filters }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  const handleViewClick = (lesson: any) => {
    setSelectedLesson({
      house: '霧鹿',
      term: '23冬',
      author: 'XXX',
      category: '自然',
      title: '蜜蜂真的不能飛？',
      grade: '全年級',
      duration: '大堂課（90分鐘）',
      staffing: '...',
      venue: '...',
      objectives: '...',
      outline: '...',
    });
    setIsModalOpen(true);
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">搜尋結果 (共 X 筆教案)</h2>
      <table className="w-full bg-white shadow-md rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border">家別</th>
            <th className="py-2 px-4 border">期數</th>
            <th className="py-2 px-4 border">課程類別</th>
            <th className="py-2 px-4 border">教案名稱</th>
            <th className="py-2 px-4 border">撰寫者</th>
            <th className="py-2 px-4 border">更多資訊</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 px-4 border text-center">範例家別</td>
            <td className="py-2 px-4 border text-center">1</td>
            <td className="py-2 px-4 border text-center">數學</td>
            <td className="py-2 px-4 border text-center">教案範例名稱</td>
            <td className="py-2 px-4 border text-center">作者A</td>
            <td className="py-2 px-4 border text-center">
              <button 
                className="px-4 py-1 bg-blue-500 text-white rounded-md focus:outline-none hover:bg-blue-700"
                onClick={() => handleViewClick({})}
              >
                查看
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <LessonPlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lessonData={selectedLesson}
      />
    </div>
  );
};

export default ResultTable;