'use client';

import { getErrorMessage, getMutedUsers, unmuteUser } from '@/app/api/api';
import { BasicUserSummary, Pagination } from '@/app/types/user';
import { Avatar, Empty, Skeleton } from 'antd';
import { ArrowLeft, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MutedUsersPage() {
    const [users, setUsers] = useState<BasicUserSummary[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [updatingId, setUpdatingId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const loadMutedUsers = async () => {
            try {
                const response = await getMutedUsers();
                if (!cancelled) {
                    setUsers(response.items);
                    setPagination(response.pagination);
                }
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load muted users.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadMutedUsers();
        return () => {
            cancelled = true;
        };
    }, []);

    const loadMore = async () => {
        if (!pagination?.hasNextPage) return;

        setLoadingMore(true);
        try {
            const response = await getMutedUsers(pagination.page + 1, pagination.limit);
            setUsers((currentUsers) => [...currentUsers, ...response.items]);
            setPagination(response.pagination);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load more muted users.'));
        } finally {
            setLoadingMore(false);
        }
    };

    const unmute = async (user: BasicUserSummary) => {
        setUpdatingId(user._id);
        setError('');
        try {
            await unmuteUser(user._id);
            setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser._id !== user._id));
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to unmute user.'));
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
                <span className="eyebrow"><VolumeX size={12} /> Settings</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Muted users</h1>
                <p className="mt-2 text-slate-500">Muted users remain followed, but their posts stay out of personalized feeds.</p>
            </header>
            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}
            {loading ? (
                <div className="surface p-6"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
            ) : users.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="You have not muted anyone" /></div>
            ) : (
                <div className="space-y-3">
                    {users.map((user) => (
                        <div key={user._id} className="surface flex items-center justify-between gap-4 p-4 sm:p-5">
                            <div className="flex min-w-0 items-center gap-3">
                                <Avatar src={user.profilePic || null}>{user.name.charAt(0)}</Avatar>
                                <p className="truncate font-semibold text-slate-900">{user.name}</p>
                            </div>
                            <button type="button" onClick={() => void unmute(user)} disabled={updatingId === user._id} className="secondary-button !min-h-0 !py-2 disabled:opacity-50">
                                {updatingId === user._id ? 'Unmuting...' : 'Unmute'}
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
