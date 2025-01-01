'use client'

import Link from 'next/link';
import { Announcement } from '../../types/announcement';
import HeaderMenu from '../../components/layout/headerMenu';

interface AnnouncementListProps {
  announcements: Announcement[];
}

const announcementData = [
  {
    id: 1,
    title: '公司春酒活動報名開始囉！',
    content: '今年的春酒活動將於X月X日在X舉辦，歡迎大家踴躍報名參加！',
    publisher: '人事部',
    publishedAt: new Date('2024-02-01'),
  },
  {
    id: 2,
    title: '新產品上線，限時優惠中！',
    content: '我們的全新產品[產品名稱]已正式上線，為慶祝上市，我們特別推出限時優惠活動。',
    publisher: '行銷部',
    publishedAt: new Date('2024-03-15'),
  },
  // Add more sample data as needed
];

const AnnouncementList = ({ announcements }: AnnouncementListProps) => {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <HeaderMenu />

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-12">公告列表</h1>
          <ul className="space-y-4">
            {announcementData.map((announcement) => (
              <Link key={announcement.id} href={`/announcement/${announcement.id}`} passHref>
                <li
                  className="cursor-pointer hover:bg-gray-100 p-4 rounded-md shadow-md transition-transform transform hover:scale-105"
                >
                  <h2 className="text-lg font-semibold">{announcement.title}</h2>
                  <p className="text-gray-600">{announcement.content.substring(0, 50)}...</p>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500">發布者：{announcement.publisher}</p>
                    <p className="text-sm text-gray-500">發布日期：{announcement.publishedAt.toLocaleDateString()}</p>
                  </div>
                </li>
              </Link>
            ))}
          </ul>
        </div>
      </div>
    );
}

export default AnnouncementList;