'use client';

import { getErrorMessage, getRecentlyViewedPosts } from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { IPost, Pagination, RecentlyViewedPostsResponse } from '@/app/types/user';
import { filterVisiblePosts } from '@/app/utils/moderation';
import PostCard from '@/components/features/PostCard';
import { Empty, Skeleton } from 'antd';
import { ArrowLeft, Clock3 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

let initialRecentlyViewedRequest: Promise<RecentlyViewedPostsResponse> | null = null;

export default function RecentlyViewedPage() {
    const currentUser = useCurrentUser();
    const currentUserId = currentUser?._id || '';
    const [posts, setPosts] = useState<IPost[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!currentUserId) return;

        let cancelled = false;
        const loadRecent = async () => {
            setLoading(true);
            setError('');
            try {
                const request = initialRecentlyViewedRequest ?? getRecentlyViewedPosts();
                initialRecentlyViewedRequest = request;
                const response = await request;
                if (!cancelled) {
                    setPosts(filterVisiblePosts(response.items));
                    setPagination(response.pagination);
                }
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load recently viewed posts.'));
            } finally {
                initialRecentlyViewedRequest = null;
                if (!cancelled) setLoading(false);
            }
        };

        void loadRecent();
        return () => {
            cancelled = true;
        };
    }, [currentUserId]);

    const loadMore = async () => {
        if (!pagination?.hasNextPage) return;
        setLoadingMore(true);
        setError('');
        try {
            const response = await getRecentlyViewedPosts(pagination.page + 1, pagination.limit);
            setPosts((currentPosts) => {
                const existingIds = new Set(currentPosts.map((post) => post._id));
                return [
                    ...currentPosts,
                    ...filterVisiblePosts(response.items).filter((post) => !existingIds.has(post._id)),
                ];
            });
            setPagination(response.pagination);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load more recently viewed posts.'));
        } finally {
            setLoadingMore(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="surface shell-container max-w-lg p-10 text-center">
                <h1 className="text-2xl font-semibold text-slate-900">Recently viewed</h1>
                <p className="mt-3 text-slate-500">Log in to see recently viewed posts.</p>
                <Link href="/login" className="primary-button mt-7">Log in to continue</Link>
            </div>
        );
    }

    return (
        <div className="shell-container max-w-3xl">
            <Link href="/profile/settings" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <ArrowLeft size={15} /> Back to settings
            </Link>
            <header className="mb-8">
                <span className="eyebrow"><Clock3 size={12} /> Profile</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Recently viewed</h1>
                <p className="mt-2 text-slate-500">Posts you opened while logged in.</p>
            </header>

            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}

            {!loading && error && posts.length === 0 ? (
                <div className="surface px-6 py-14 text-center text-sm text-slate-500">We could not load recently viewed posts right now. Please try again in a moment.</div>
            ) : loading ? (
                <div className="surface p-6"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
            ) : posts.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="No recently viewed posts yet" /></div>
            ) : (
                <div className="space-y-5">
                    {posts.map((post) => (
                        <PostCard key={post._id} post={post} currentUser={currentUser} isBookmarked={post.isSavedByMe ?? post.isBookmarked} />
                    ))}
                    {pagination?.hasNextPage && (
                        <button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="secondary-button mx-auto flex">
                            {loadingMore ? 'Loading...' : 'Load more'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
