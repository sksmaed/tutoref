import Link from 'next/link';
import { Announcement } from '@/types/announcement';
import HeaderMenu from '@/components/layout/headerMenu';

interface AnnouncementListProps {
  announcements: Announcement[];
}

const AnnouncementList = ({ announcements }: AnnouncementListProps) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <HeaderMenu />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-12">公告列表</h1>
        <ul className="space-y-4">
          {announcements.map((announcement) => (
            <Link key={announcement.id} href={`/announcement/${announcement.id}`} passHref>
              <li
                className="cursor-pointer hover:bg-gray-100 p-4 rounded-md shadow-md transition-transform transform hover:scale-105"
              >
                <h2 className="text-lg font-semibold">{announcement.title}</h2>
                <p className="text-gray-600">{announcement.content.substring(0, 50)}...</p>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-500">發布者：{announcement.writer_name}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-500">發布時間：{new Date(announcement.created_at).toLocaleString()}</p>
                </div>
              </li>
            </Link>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnnouncementList;