'use client';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, message, Skeleton } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getPostById } from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { IPost } from '@/app/types/user';
import CommentList from '@/components/features/CommentList';
import PostCard from '@/components/features/PostCard';

export default function PostDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [post, setPost] = useState<IPost | null>(null);
    const [loading, setLoading] = useState(true);
    const currentUser = useCurrentUser();

    const fetchPost = async () => {
        try {
            setPost(await getPostById(id));
        } catch {
            message.error('Failed to load post');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const loadPost = async () => {
            try {
                const nextPost = await getPostById(id);
                if (!cancelled) setPost(nextPost);
            } catch {
                if (!cancelled) message.error('Failed to load post');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadPost();
        return () => {
            cancelled = true;
        };
    }, [id]);

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
