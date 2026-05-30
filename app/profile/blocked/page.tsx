'use client';

import { getBlockedUsers, getErrorMessage, unblockUser } from '@/app/api/api';
import { BasicUserSummary, Pagination } from '@/app/types/user';
import { Avatar, Empty, Skeleton } from 'antd';
import { ArrowLeft, Ban } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function BlockedUsersPage() {
    const [users, setUsers] = useState<BasicUserSummary[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [updatingId, setUpdatingId] = useState('');
    const [error, setError] = useState('');
    const [requiresLogin, setRequiresLogin] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const loadBlockedUsers = async () => {
            const hasToken = Boolean(localStorage.getItem('token'));
            await Promise.resolve();

            if (cancelled) return;
            if (!hasToken) {
                setRequiresLogin(true);
                setError('Log in to manage blocked users.');
                setLoading(false);
                return;
            }

            try {
                const response = await getBlockedUsers();
                if (!cancelled) {
                    setUsers(response.items);
                    setPagination(response.pagination);
                }
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load blocked users.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadBlockedUsers();
        return () => {
            cancelled = true;
        };
    }, []);

    const loadMore = async () => {
        if (!pagination?.hasNextPage) return;

        setLoadingMore(true);
        setError('');
        try {
            const response = await getBlockedUsers(pagination.page + 1, pagination.limit);
            setUsers((currentUsers) => [...currentUsers, ...response.items]);
            setPagination(response.pagination);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load more blocked users.'));
        } finally {
            setLoadingMore(false);
        }
    };

    const unblock = async (user: BasicUserSummary) => {
        setUpdatingId(user._id);
        setError('');
        try {
            await unblockUser(user._id);
            setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser._id !== user._id));
            setPagination((current) => current ? { ...current, total: Math.max(0, current.total - 1) } : current);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to unblock user.'));
        } finally {
            setUpdatingId('');
        }
    };

    if (error && users.length === 0 && requiresLogin) {
        return (
            <div className="surface shell-container max-w-lg p-10 text-center">
                <h1 className="text-2xl font-semibold text-slate-900">Blocked users</h1>
                <p className="mt-3 text-slate-500">{error}</p>
                <Link href="/login" className="primary-button mt-7">Log in to continue</Link>
            </div>
        );
    }

    return (
        <div className="shell-container max-w-2xl">
            <Link href="/profile/settings" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <ArrowLeft size={15} /> Back to settings
            </Link>

            <header className="mb-7">
                <span className="eyebrow"><Ban size={12} /> Settings</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Blocked users</h1>
                <p className="mt-2 text-slate-500">Unblocking someone does not automatically follow them again.</p>
            </header>

            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}

            {loading ? (
                <div className="surface p-6"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
            ) : users.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="You have not blocked anyone" /></div>
            ) : (
                <div className="space-y-3">
                    {users.map((user) => (
                        <div key={user._id} className="surface flex items-center justify-between gap-4 p-4 sm:p-5">
                            <div className="flex min-w-0 items-center gap-3">
                                <Avatar src={user.profilePic || null}>{user.name.charAt(0)}</Avatar>
                                <p className="truncate font-semibold text-slate-900">{user.name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => void unblock(user)}
                                disabled={updatingId === user._id}
                                className="secondary-button !min-h-0 !py-2 disabled:opacity-50"
                            >
                                {updatingId === user._id ? 'Unblocking...' : 'Unblock'}
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
