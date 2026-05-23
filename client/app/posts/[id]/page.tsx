'use client';

import { getPostById } from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { IPost } from '@/app/types/user';
import CommentList from '@/components/features/CommentList';
import PostCard from '@/components/features/PostCard';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { App, Button, Skeleton } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PostDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [post, setPost] = useState<IPost | null>(null);
    const [loading, setLoading] = useState(true);
    const currentUser = useCurrentUser();
    const { message } = App.useApp();

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
            <div className="shell-container max-w-3xl py-8">
                <Skeleton active avatar paragraph={{ rows: 4 }} />
            </div>
        );
    }

    if (!post) {
        return <div className="surface shell-container max-w-3xl py-14 text-center text-slate-500">Post not found</div>;
    }

    return (
        <div className="shell-container max-w-3xl">
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
                className="!mb-5 !rounded-xl !text-slate-500"
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
