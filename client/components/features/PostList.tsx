'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import PostCard from './PostCard';
import { List, Skeleton, Empty, message } from 'antd';

const PostList = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await api.get('/posts');
            setPosts(res.data);
        } catch (error) {
            console.error('Error fetching posts:', error);
            message.error('Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/posts/${id}`);
            setPosts(posts.filter((post) => post._id !== id));
            message.success('Post deleted');
        } catch (error) {
            message.error('Failed to delete post');
        }
    };

    if (loading) {
        return <Skeleton active avatar paragraph={{ rows: 4 }} />;
    }

    if (posts.length === 0) {
        return <Empty description="No posts found. Be the first to share!" />;
    }

    return (
        <div className="max-w-2xl mx-auto">
            {posts.map((post) => (
                <PostCard
                    key={post._id}
                    post={post}
                    onDelete={handleDelete}
                    currentUser={currentUser}
                />
            ))}
        </div>
    );
};

export default PostList;
