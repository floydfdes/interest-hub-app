'use client';

import { getPostById, getPostComments } from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { IComment, IPost } from '@/app/types/user';
import { filterVisibleComments, isUnderReview } from '@/app/utils/moderation';
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
    const [comments, setComments] = useState<IComment[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUser = useCurrentUser();
    const { message } = App.useApp();

    const fetchComments = async () => {
        const response = await getPostComments(id);
        setComments(filterVisibleComments(response.items));
    };

    const fetchPost = async () => {
        try {
            const nextPost = await getPostById(id);
            if (isUnderReview(nextPost)) {
                setPost(null);
                return;
            }
            setPost(nextPost);
            await fetchComments();
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
                if (isUnderReview(nextPost)) {
                    if (!cancelled) setPost(null);
                    return;
                }
                const response = await getPostComments(id);
                if (!cancelled) {
                    setPost(nextPost);
                    setComments(filterVisibleComments(response.items));
                }
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
    }, [id, message]);

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
            <PostCard post={post} currentUser={currentUser} onArchive={() => router.push('/profile/archived-posts')} />
            <CommentList
                comments={comments}
                postId={post._id}
                onCommentAdded={fetchPost}
            />
        </div>
    );
}
