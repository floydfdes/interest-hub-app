'use client';

import { deletePost, getAllPosts } from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { IPost } from '@/app/types/user';
import { App, Empty, Skeleton } from 'antd';
import { useEffect, useState } from 'react';
import PostCard from './PostCard';

const PostList = () => {
    const [posts, setPosts] = useState<IPost[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUser = useCurrentUser();
    const { message } = App.useApp();

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
        return (
            <div className="surface p-6">
                <Skeleton active avatar paragraph={{ rows: 4 }} />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="surface px-6 py-14">
                <Empty description={<span className="text-slate-500">No posts yet. Be the first to share an interest.</span>} />
            </div>
        );
    }

    return (
        <div className="space-y-5">
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
