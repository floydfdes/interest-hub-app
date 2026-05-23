'use client';

import { useEffect, useState } from 'react';
import { Empty, message, Skeleton } from 'antd';
import { deletePost, getAllPosts } from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { IPost } from '@/app/types/user';
import PostCard from './PostCard';

const PostList = () => {
    const [posts, setPosts] = useState<IPost[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUser = useCurrentUser();

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setPosts(await getAllPosts());
            } catch {
                message.error('Failed to load posts');
            } finally {
                setLoading(false);
            }
        };

        void fetchPosts();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await deletePost(id);
            setPosts((currentPosts) => currentPosts.filter((post) => post._id !== id));
            message.success('Post deleted');
        } catch {
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
