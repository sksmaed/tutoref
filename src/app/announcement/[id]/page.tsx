'use client'

import { use, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface AnnouncementDetailProps {
  params: Promise<{ id: string }>;
}

const AnnouncementDetail = ({ params }: AnnouncementDetailProps) => {
  const { id } = use(params);

  const [announcement, setAnnouncement] = useState({
    title: 'Loading...',
    content: 'Loading...',
    writer_name: 'Loading...',
    created_at: 'Loading...',
  });

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const response = await fetch(`/api/announcements/${id}`);
      const data = await response.json();
      setAnnouncement(data);
    };

    fetchAnnouncement();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{announcement.title}</h1>
        <div className="prose">
          <ReactMarkdown>{announcement.content}</ReactMarkdown>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <p className="text-gray-600">By {announcement.writer_name}</p>
          <p className="text-gray-600">{announcement.created_at}</p>
        </div>

        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md mt-6"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default AnnouncementDetail;
