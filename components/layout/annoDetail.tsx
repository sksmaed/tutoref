import { useState } from 'react';
import { Announcement } from '../../types/announcement';

import { GetServerSidePropsContext } from 'next';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.query;
  const res = await fetch(`https://your-api/announcements/${id}`);
  const announcement = await res.json();

  return {
    props: {
      announcement,
    },
  };
}

function AnnouncementDetail({ announcement }: { announcement: Announcement }) {
  const [isLoading] = useState(true);

  return (
    <div>
      {isLoading ? (
        <p>正在載入公告...</p>
      ) : announcement ? (
        <>
          <h1>{announcement.title}</h1>
          <p>{announcement.content}</p>
          {/* 其他公告資訊 */}
        </>
      ) : (
        <p>找不到該公告</p>
      )}
    </div>
  );
}

export default AnnouncementDetail;