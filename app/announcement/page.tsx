'use client'

import { useEffect, useState } from 'react';
import AnnouncementList from '../../components/layout/announcementList';
import { Announcement } from '../../types/announcement';

const AnnouncementPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const response = await fetch('/api/announcements');
      const data = await response.json();
      setAnnouncements(data);
    };

    fetchAnnouncements();
  }, []);

  return <AnnouncementList announcements={announcements} />;
};

export default AnnouncementPage;