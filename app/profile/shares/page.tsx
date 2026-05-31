'use client';

import { getErrorMessage, getReceivedShares, getSentShares } from '@/app/api/api';
import { Pagination, UserShare } from '@/app/types/user';
import { Avatar, Empty, Skeleton } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Inbox, Send } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type ShareTab = 'received' | 'sent';

function shareTargetLabel(share: UserShare) {
    if (share.targetType === 'post') return share.post?.title || 'Shared post';
    return share.profile?.name || share.targetUser?.name || 'Shared profile';
}

function shareHref(share: UserShare) {
    if (share.targetType === 'post') return `/posts/${share.post?._id || share.targetId || ''}`;
    return `/users/${share.profile?._id || share.targetUser?._id || share.targetId || ''}`;
}

export default function ProfileSharesPage() {
    const [tab, setTab] = useState<ShareTab>('received');
    const [shares, setShares] = useState<UserShare[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const loadShares = async () => {
            if (!localStorage.getItem('token')) {
                if (!cancelled) {
                    setError('Log in to see your shares.');
                    setLoading(false);
                }
                return;
            }

            setLoading(true);
            setError('');
            try {
                const response = tab === 'received' ? await getReceivedShares() : await getSentShares();
                if (!cancelled) {
                    setShares(response.items);
                    setPagination(response.pagination);
                }
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load shares.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void loadShares();
        return () => {
            cancelled = true;
        };
    }, [tab]);

    const loadMore = async () => {
        if (!pagination?.hasNextPage) return;
        setLoadingMore(true);
        setError('');
        try {
            const response = tab === 'received'
                ? await getReceivedShares(pagination.page + 1, pagination.limit)
                : await getSentShares(pagination.page + 1, pagination.limit);
            setShares((current) => [...current, ...response.items]);
            setPagination(response.pagination);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load more shares.'));
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
                <span className="eyebrow"><Inbox size={12} /> Profile</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Shares</h1>
                <p className="mt-2 text-slate-500">Posts and profiles shared with you, plus items you sent.</p>
            </header>

            <div className="surface mb-5 flex gap-2 p-1.5">
                <button
                    type="button"
                    onClick={() => setTab('received')}
                    aria-pressed={tab === 'received'}
                    className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === 'received' ? 'bg-[#E9F2F9] text-[#1B325F]' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Received
                </button>
                <button
                    type="button"
                    onClick={() => setTab('sent')}
                    aria-pressed={tab === 'sent'}
                    className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === 'sent' ? 'bg-[#E9F2F9] text-[#1B325F]' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Sent
                </button>
            </div>

            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}
            {loading ? (
                <div className="surface p-6"><Skeleton active paragraph={{ rows: 5 }} /></div>
            ) : shares.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description={tab === 'received' ? 'No shares received' : 'No shares sent'} /></div>
            ) : (
                <div className="space-y-3">
                    {shares.map((share) => {
                        const actor = tab === 'received' ? share.sender : share.recipient;
                        const href = shareHref(share);
                        const isPost = share.targetType === 'post';
                        return (
                            <Link key={share._id} href={href} className="surface block p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-28px_rgba(15,23,42,0.25)]">
                                <div className="flex gap-4">
                                    {isPost && share.post?.image ? (
                                        <Image src={share.post.image} alt="" width={72} height={72} className="h-[72px] w-[72px] rounded-xl object-cover" />
                                    ) : (
                                        <Avatar src={actor?.profilePic || null} size={48}>{actor?.name?.charAt(0) || '?'}</Avatar>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="truncate text-sm font-semibold text-slate-900">{shareTargetLabel(share)}</p>
                                            <span className="tag-pill capitalize">{share.targetType}</span>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {tab === 'received' ? 'From' : 'To'} {actor?.name || 'Unknown user'}
                                        </p>
                                        {share.message && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{share.message}</p>}
                                        <p className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                                            <Send size={12} /> {formatDistanceToNow(new Date(share.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
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
