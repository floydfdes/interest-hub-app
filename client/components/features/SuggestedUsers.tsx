'use client';

import { followUser, getErrorMessage, getSuggestedUsers } from '@/app/api/api';
import { IUser } from '@/app/types/user';
import { Avatar, Skeleton } from 'antd';
import { RefreshCcw, UserPlus, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SuggestedUsersProps {
    authenticated: boolean;
}

export default function SuggestedUsers({ authenticated }: SuggestedUsersProps) {
    const [users, setUsers] = useState<IUser[]>([]);
    const [loading, setLoading] = useState(authenticated);
    const [loaded, setLoaded] = useState(false);
    const [followingId, setFollowingId] = useState('');
    const [error, setError] = useState('');

    const loadSuggestions = async () => {
        setLoading(true);
        setError('');
        try {
            setUsers(await getSuggestedUsers());
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load suggested users.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authenticated) return;

        let cancelled = false;
        const loadInitialSuggestions = async () => {
            try {
                const suggestions = await getSuggestedUsers();
                if (!cancelled) setUsers(suggestions);
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load suggested users.'));
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    setLoaded(true);
                }
            }
        };

        void loadInitialSuggestions();
        return () => {
            cancelled = true;
        };
    }, [authenticated]);

    if (!authenticated) return null;

    const handleFollow = async (id: string) => {
        setFollowingId(id);
        setError('');
        try {
            await followUser(id);
            setUsers((currentUsers) => currentUsers.filter((user) => user._id !== id));
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to follow user.'));
        } finally {
            setFollowingId('');
        }
    };

    return (
        <section className="surface mb-7 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <UsersRound size={18} className="text-indigo-600" />
                        Suggested users
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">People whose interests may match yours.</p>
                </div>
                <button type="button" onClick={() => void loadSuggestions()} className="secondary-button !min-h-0 !px-3 !py-2" disabled={loading}>
                    <RefreshCcw size={14} />
                    Refresh
                </button>
            </div>

            {error && <p className="mb-4 text-sm font-medium text-rose-600">{error}</p>}
            {loading || !loaded ? (
                <Skeleton active paragraph={{ rows: 1 }} />
            ) : users.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No suggestions available right now.</p>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {users.map((user) => (
                        <div key={user._id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3">
                            <Avatar src={user.profilePic || null}>{user.name.charAt(0)}</Avatar>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                                <p className="truncate text-xs text-slate-500">{user.interests?.slice(0, 2).join(', ') || 'New connection'}</p>
                            </div>
                            <button
                                type="button"
                                aria-label={`Follow ${user.name}`}
                                onClick={() => void handleFollow(user._id)}
                                disabled={followingId === user._id}
                                className="rounded-xl bg-indigo-50 p-2 text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50"
                            >
                                <UserPlus size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
