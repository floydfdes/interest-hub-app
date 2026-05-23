'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import PostCard from '@/components/features/PostCard';
import CommentList from '@/components/features/CommentList';
import { Button, Skeleton, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        fetchPost();
    }, [params.id]);

    const fetchPost = async () => {
        try {
            const res = await api.get(`/posts/${params.id}`);
            setPost(res.data);
        } catch (error) {
            console.error('Error fetching post:', error);
            message.error('Failed to load post');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto py-8">
                <Skeleton active avatar paragraph={{ rows: 4 }} />
            </div>
        );
    }

    if (!post) {
        return <div className="text-center py-10">Post not found</div>;
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
                className="mb-4"
            >
                Back
            </Button>

            <PostCard post={post} currentUser={currentUser} />

            <CommentList
                comments={post.comments || []}
                postId={post._id}
                onCommentAdded={fetchPost}
            />
        </div>
    );
}
