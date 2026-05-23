'use client';

import PostList from '@/components/features/PostList';
import { Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const { Title } = Typography;

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Latest Interests</Title>
        {user && (
          <Link href="/create-post">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              Create Post
            </Button>
          </Link>
        )}
      </div>
      <PostList />
    </div>
  );
}
