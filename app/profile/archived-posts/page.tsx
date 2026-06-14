'use client';

import { getArchivedPosts, getErrorMessage, unarchivePost } from '@/app/api/api';
import { IPost, Pagination } from '@/app/types/user';
import { Empty, Skeleton } from 'antd';
import { Archive, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ArchivedPostsPage() {
    const [posts, setPosts] = useState<IPost[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [updatingId, setUpdatingId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const loadPosts = async () => {
            try {
                const response = await getArchivedPosts();
                if (!cancelled) {
                    setPosts(response.items);
                    setPagination(response.pagination);
                }
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load archived posts.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void loadPosts();
        return () => {
            cancelled = true;
        };
    }, []);

    const loadMore = async () => {
        if (!pagination?.hasNextPage) return;
        setLoadingMore(true);
        setError('');
        try {
            const response = await getArchivedPosts(pagination.page + 1, pagination.limit);
            setPosts((current) => [...current, ...response.items]);
            setPagination(response.pagination);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load more archived posts.'));
        } finally {
            setLoadingMore(false);
        }
    };

    const unarchive = async (post: IPost) => {
        setUpdatingId(post._id);
        setError('');
        try {
            await unarchivePost(post._id);
            setPosts((current) => current.filter((item) => item._id !== post._id));
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to unarchive post.'));
        } finally {
            setUpdatingId('');
        }
    };

    return (
        <div className="shell-container max-w-3xl">
            <Link href="/profile/settings" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <ArrowLeft size={15} /> Back to settings
            </Link>
            <header className="mb-7">
                <span className="eyebrow"><Archive size={12} /> Settings</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Archived posts</h1>
                <p className="mt-2 text-slate-500">Archived posts are visible only here until you restore them.</p>
            </header>
            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}
            {!loading && error && posts.length === 0 ? (
                <div className="surface px-6 py-14 text-center text-sm text-slate-500">We could not load archived posts right now. Please try again in a moment.</div>
            ) : loading ? (
                <div className="surface p-6"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
            ) : posts.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="You have no archived posts" /></div>
            ) : (
                <div className="space-y-3">
                    {posts.map((post) => (
                        <div key={post._id} className="surface flex items-center gap-4 p-4 sm:p-5">
                            <Image src={post.image || '/default_image.png'} alt="" width={72} height={56} className="h-14 w-[4.5rem] rounded-xl object-cover" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-slate-900">{post.title}</p>
                                <p className="truncate text-sm text-slate-500">{post.category || 'Post'}</p>
                            </div>
                            <button type="button" onClick={() => void unarchive(post)} disabled={updatingId === post._id} className="secondary-button !min-h-0 !py-2 disabled:opacity-50">
                                {updatingId === post._id ? 'Restoring...' : 'Unarchive'}
                            </button>
                        </div>
                    ))}
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
