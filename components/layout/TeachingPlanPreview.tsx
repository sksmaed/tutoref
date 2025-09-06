import React from 'react';
import { TeachingPlan } from '@/types/api';
import SlideUpload from '@/components/ui/SlideUpload';

interface TeachingPlanPreviewProps {
  plan: TeachingPlan;
}

const TeachingPlanPreview: React.FC<TeachingPlanPreviewProps> = ({
  plan
}) => {
  const handleSlideFileChange = (fileName: string) => {
    console.log('投影片檔案已選擇:', fileName);
  };

  const handleSlideFileRemove = () => {
    console.log('投影片檔案已移除');
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center">
      <div>
        <p className="text-xl leading-[1.5] text-black-900 text-center mb-8">
          以下資訊為系統自動辨識檔案內容產生，供大家在檢索結果中預覽，
          <br />    
          對內容有疑可點擊「編輯內容」進行修改！
        </p>
      </div>

      {/* 預覽表格 */}
      <div className="w-[777px] bg-white rounded-lg shadow-lg border border-black-200 overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
          {/* 課程名稱 */}
          <tr className="px-11 py-2">
            <td className="w-[120px] border-l-0 border-t-0 border-r border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
              課程名稱
            </td>
            <td className="border-t-0 border-r-0 border-b border-l border-black-200 px-10 py-3" colSpan={3}>
              <span className="text-black-900 text-base leading-[1.5]">{plan.tp_name}</span>
            </td>
          </tr>

          {/* 家別 */}
          <tr>
            <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
              家別
            </td>
            <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3">
              <span className="text-black-900 text-base leading-[1.5]">{plan.team}</span>
            </td>
          </tr>

          {/* 期數 */}
          <tr>
            <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
              期數
            </td>
            <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
              <span className="text-black-900 text-base leading-[1.5]">{plan.semester}</span>
            </td>
          </tr>

          {/* 撰寫者 */}
          <tr>
            <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
              撰寫者
            </td>
            <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
              <span className="text-black-900 text-base leading-[1.5]">{plan.writer_name}</span>
            </td>
          </tr>

          {/* 類別 */}
          <tr>
            <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
              類別
            </td>
            <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
              <span className="text-black-900 text-base leading-[1.5]">{plan.category}</span>
            </td>
          </tr>

          {/* 適用年級 */}
          <tr>
            <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
              適用年級
            </td>
            <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
              <span className="text-black-900 text-base leading-[1.5]">{plan.grade}</span>
            </td>
          </tr>

          {/* 課程時長 */}
          <tr>
            <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
              課程時長
            </td>
            <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
              <span className="text-black-900 text-base leading-[1.5]">{plan.duration}</span>
            </td>
          </tr>

          {/* 課程目標 */}
          <tr>
            <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
              課程目標
            </td>
            <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
              <div className="space-y-2">
                <div className="max-h-32 overflow-y-auto">
                  <div className="text-base text-black-900 leading-[1.5] whitespace-pre-line">
                    {plan.objectives ? (
                      plan.objectives.split('\n').filter(line => line.trim()).map((line, index) => (
                        <div key={index} className="mb-1">
                          {line.trim().match(/^\d+\./) ? line.trim() : `${index + 1}. ${line.trim()}`}
                        </div>
                      ))
                    ) : (
                      <div className="text-black-500 italic">暫無課程目標資訊</div>
                    )}
                  </div>
                </div>
              </div>
            </td>
          </tr>

          {/* 課程大綱 */}
          <tr>
            <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
              課程大綱
            </td>
            <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
              <div className="space-y-2">
                <div className="max-h-32 overflow-y-auto">
                  <div className="text-base text-black-900 leading-[1.5] whitespace-pre-line">
                    {plan.outline ? (
                      plan.outline.split('\n').filter(line => line.trim()).map((line, index) => (
                        <div key={index} className="mb-1">
                          {line.trim().match(/^\d+\./) ? line.trim() : `${index + 1}. ${line.trim()}`}
                        </div>
                      ))
                    ) : (
                      <div className="text-black-500 italic">暫無課程大綱資訊</div>
                    )}
                  </div>
                </div>
              </div>
            </td>
          </tr>

          {/* 完課筆記 */}
          <tr>
            <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
              完課筆記
            </td>
            <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
              <div className="space-y-2">
                <div className="max-h-24 overflow-y-auto">
                  <div className="text-base text-black-900 leading-[1.5] whitespace-pre-line">
                    {plan.completion_notes ? (
                      plan.completion_notes.split('\n').filter(line => line.trim()).map((line, index) => (
                        <div key={index} className="mb-1">
                          {line.trim().match(/^\d+\./) ? line.trim() : `${index + 1}. ${line.trim()}`}
                        </div>
                      ))
                    ) : (
                      <div className="text-black-500 italic">暫無完課筆記資訊</div>
                    )}
                  </div>
                </div>
              </div>
            </td>
          </tr>

          {/* 投影片 */}
          <tr>
            <td className="w-[120px] border-l-0 border-b-0 border-r border-t border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
              投影片
            </td>
            <td className="border border-black-200 pl-6 pr-10 py-4" colSpan={3}>
              <SlideUpload
                initialFileName={plan.slide_pdf}
                onFileChange={handleSlideFileChange}
                onFileRemove={handleSlideFileRemove}
              />
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default TeachingPlanPreview;
