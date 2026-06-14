'use client';

import { acceptFollowRequest, getErrorMessage, getFollowRequests, rejectFollowRequest } from '@/app/api/api';
import { BasicUserSummary, Pagination } from '@/app/types/user';
import { Avatar, Empty, Skeleton } from 'antd';
import { ArrowLeft, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function FollowRequestsPage() {
    const [users, setUsers] = useState<BasicUserSummary[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [updatingId, setUpdatingId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const loadRequests = async () => {
            try {
                const response = await getFollowRequests();
                if (!cancelled) {
                    setUsers(response.items);
                    setPagination(response.pagination);
                }
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load follow requests.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void loadRequests();
        return () => {
            cancelled = true;
        };
    }, []);

    const loadMore = async () => {
        if (!pagination?.hasNextPage) return;
        setLoadingMore(true);
        setError('');
        try {
            const response = await getFollowRequests(pagination.page + 1, pagination.limit);
            setUsers((current) => [...current, ...response.items]);
            setPagination(response.pagination);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load more follow requests.'));
        } finally {
            setLoadingMore(false);
        }
    };

    const resolveRequest = async (user: BasicUserSummary, accept: boolean) => {
        setUpdatingId(user._id);
        setError('');
        try {
            await (accept ? acceptFollowRequest(user._id) : rejectFollowRequest(user._id));
            setUsers((current) => current.filter((requester) => requester._id !== user._id));
            setPagination((current) => current ? { ...current, total: Math.max(0, current.total - 1) } : current);
        } catch (err: unknown) {
            setError(getErrorMessage(err, `Failed to ${accept ? 'accept' : 'reject'} follow request.`));
        } finally {
            setUpdatingId('');
        }
    };

    return (
        <div className="shell-container max-w-2xl">
            <Link href="/profile/settings" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <ArrowLeft size={15} /> Back to settings
            </Link>
            <header className="mb-7">
                <span className="eyebrow"><UserCheck size={12} /> Settings</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Follow requests</h1>
                <p className="mt-2 text-slate-500">Choose who can follow your private account.</p>
            </header>
            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}
            {!loading && error && users.length === 0 ? (
                <div className="surface px-6 py-14 text-center text-sm text-slate-500">We could not load follow requests right now. Please try again in a moment.</div>
            ) : loading ? (
                <div className="surface p-6"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
            ) : users.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="No pending follow requests" /></div>
            ) : (
                <div className="space-y-3">
                    {users.map((user) => (
                        <div key={user._id} className="surface flex items-center justify-between gap-4 p-4 sm:p-5">
                            <div className="flex min-w-0 items-center gap-3">
                                <Avatar src={user.profilePic || null}>{user.name.charAt(0)}</Avatar>
                                <p className="truncate font-semibold text-slate-900">{user.name}</p>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => void resolveRequest(user, false)} disabled={updatingId === user._id} className="secondary-button !min-h-0 !py-2 disabled:opacity-50">Reject</button>
                                <button type="button" onClick={() => void resolveRequest(user, true)} disabled={updatingId === user._id} className="primary-button !min-h-0 !py-2 disabled:opacity-50">Accept</button>
                            </div>
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
