'use client';

import { getErrorMessage, getReviewPosts } from '@/app/api/api';
import { IPost, Pagination } from '@/app/types/user';
import { getModerationNoticeMessage } from '@/app/utils/moderation';
import { Empty, Skeleton } from 'antd';
import { ArrowLeft, Edit, ShieldAlert } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function formatReasons(reasons: string[] | undefined) {
    if (!reasons || reasons.length === 0) return 'Moderation review';
    return reasons.map((reason) => reason.replaceAll('_', ' ')).join(', ');
}

export default function ReviewPostsPage() {
    const [posts, setPosts] = useState<IPost[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const loadReviewPosts = async () => {
            try {
                const response = await getReviewPosts();
                if (!cancelled) {
                    setPosts(response.items);
                    setPagination(response.pagination);
                }
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load posts under review.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadReviewPosts();
        return () => {
            cancelled = true;
        };
    }, []);

    const loadMore = async () => {
        if (!pagination?.hasNextPage) return;

        setLoadingMore(true);
        setError('');
        try {
            const response = await getReviewPosts(pagination.page + 1, pagination.limit);
            setPosts((currentPosts) => [...currentPosts, ...response.items]);
            setPagination(response.pagination);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load more posts under review.'));
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <div className="shell-container max-w-3xl">
            <Link href="/profile/settings" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <ArrowLeft size={15} /> Back to settings
            </Link>
            <header className="mb-7">
                <span className="eyebrow"><ShieldAlert size={12} /> Profile</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Under Review</h1>
                <p className="mt-2 text-slate-500">Posts hidden from normal feeds while moderation checks them.</p>
            </header>
            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}
            {!loading && error && posts.length === 0 ? (
                <div className="surface px-6 py-14 text-center text-sm text-slate-500">We could not load posts under review right now. Please try again in a moment.</div>
            ) : loading ? (
                <div className="surface p-6"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
            ) : posts.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="You have no posts under review" /></div>
            ) : (
                <div className="space-y-3">
                    {posts.map((post) => {
                        const notice = getModerationNoticeMessage(post);
                        const reasons = post.moderationNotice?.reasons || post.moderationReasons;
                        return (
                            <div key={post._id} className="surface flex items-start gap-4 p-4 sm:p-5">
                                <Image src={post.image || '/default_image.png'} alt="" width={72} height={56} className="h-14 w-[4.5rem] rounded-xl object-cover" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate font-semibold text-slate-900">{post.title}</p>
                                        <span className="tag-pill !bg-amber-50 !text-amber-700">Under review</span>
                                    </div>
                                    <p className="mt-1 text-sm capitalize text-slate-500">{formatReasons(reasons)}</p>
                                    {notice && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{notice}</p>}
                                </div>
                                <Link href={`/explore/post/${post._id}/edit`} className="secondary-button !min-h-0 !shrink-0 !py-2">
                                    <Edit size={15} /> Edit
                                </Link>
                            </div>
                        );
                    })}
                    {pagination?.hasNextPage && (
                        <button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="secondary-button mx-auto">
                            {loadingMore ? 'Loading...' : 'Load more'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
