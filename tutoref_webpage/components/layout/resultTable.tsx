import React, { useState } from 'react';
import { TeachingPlan } from '../../types/api';
import LessonPlanModal from './LessonPlanModal';

interface ResultTableProps {
  results: TeachingPlan[];
}

const ResultTable: React.FC<ResultTableProps> = ({ results }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<TeachingPlan | null>(null);

  const handleViewClick = (lesson: TeachingPlan) => {
    setSelectedLesson(lesson);
    setIsModalOpen(true);
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">
        搜尋結果 (共 {results.length} 筆教案)
      </h2>
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
          {results.length > 0 ? (
            results.map((plan) => (
              <tr key={plan.id}>
                <td className="py-2 px-4 border text-center">{plan.team}</td>
                <td className="py-2 px-4 border text-center">{plan.semester}</td>
                <td className="py-2 px-4 border text-center">{plan.category}</td>
                <td className="py-2 px-4 border text-center">{plan.tp_name}</td>
                <td className="py-2 px-4 border text-center">{plan.writer_name}</td>
                <td className="py-2 px-4 border text-center">
                  <button 
                    className="px-4 py-1 bg-blue-500 text-white rounded-md focus:outline-none hover:bg-blue-700"
                    onClick={() => handleViewClick(plan)}
                  >
                    查看
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="py-4 text-center text-gray-500">
                尚無搜尋結果
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedLesson && (
        <LessonPlanModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          lessonData={selectedLesson}
        />
      )}
    </div>
  );
};

export default ResultTable;