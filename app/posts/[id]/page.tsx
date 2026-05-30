'use client';

import { getBookmarkedPosts, getPostById } from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { IPost } from '@/app/types/user';
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
    const [loading, setLoading] = useState(true);
    const currentUser = useCurrentUser();
    const { message } = App.useApp();

    const fetchPost = async () => {
        try {
            const nextPost = await getPostById(id);
            if (isUnderReview(nextPost)) {
                setPost(null);
                return;
            }
            if (localStorage.getItem('token')) {
                const bookmarks = await getBookmarkedPosts().catch(() => []);
                nextPost.isBookmarked = bookmarks.some((bookmark) => bookmark._id === id) || nextPost.isBookmarked;
            }
            setPost({ ...nextPost, comments: filterVisibleComments(nextPost.comments || []) });
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
                if (localStorage.getItem('token')) {
                    const bookmarks = await getBookmarkedPosts().catch(() => []);
                    nextPost.isBookmarked = bookmarks.some((bookmark) => bookmark._id === id) || nextPost.isBookmarked;
                }
                if (!cancelled) setPost({ ...nextPost, comments: filterVisibleComments(nextPost.comments || []) });
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
                comments={post.comments || []}
                postId={post._id}
                onCommentAdded={fetchPost}
            />
        </div>
    );
}
