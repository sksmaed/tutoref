'use client'

import { use } from 'react';

interface AnnouncementDetailProps {
  params: Promise<{ id: string }>;  // The params object is now a Promise
}

const AnnouncementDetail = ({ params }: AnnouncementDetailProps) => {
  const { id } = use(params);

  // Fetch the data or use a mockup for the details
  const announcement = {
    id,
    title: '公告標題',
    content: '詳細內容：這裡是公告的完整內容。',
    publisher: '發布者：XXX',
    publishedAt: '發布日期：2024年X月X日',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{announcement.title}</h1>
        <p className="text-gray-600 mb-4">{announcement.content}</p>
        <div className="flex flex-col gap-2">
          <p>{announcement.publisher}</p>
          <p>{announcement.publishedAt}</p>
        </div>

        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md mt-6"
        >
          返回
        </button>
      </div>
    </div>
  );
};

export default AnnouncementDetail;