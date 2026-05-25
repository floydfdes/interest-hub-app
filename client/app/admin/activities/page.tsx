'use client';

import { getAdminActivities, getErrorMessage } from '@/app/api/api';
import { ActivityType, AdminActivitiesResponse, AdminUserActivity } from '@/app/types/user';
import { Drawer, Empty, Skeleton } from 'antd';
import { format } from 'date-fns';
import { Activity, Eye, Search } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

const activityOptions: Array<{ value: ActivityType; label: string }> = [
    { value: 'login', label: 'Login' },
    { value: 'post_created', label: 'Post created' },
    { value: 'user_followed', label: 'User followed' },
    { value: 'post_liked', label: 'Post liked' },
    { value: 'user_blocked', label: 'User blocked' },
    { value: 'user_unblocked', label: 'User unblocked' },
];

const actionLabels: Record<ActivityType, string> = {
    login: 'Logged in',
    post_created: 'Created a post',
    user_followed: 'Followed a user',
    post_liked: 'Liked a post',
    report_submitted: 'Submitted a report',
    user_blocked: 'Blocked a user',
    user_unblocked: 'Unblocked a user',
};

function formatActivityDate(date: string) {
    return format(new Date(date), 'MMM d, yyyy, h:mm a');
}

function getActivityTarget(activity: AdminUserActivity) {
    if (activity.post) return activity.post.title;
    if (activity.targetUser) return activity.targetUser.name;
    return '-';
}

export default function AdminActivitiesPage() {
    const [response, setResponse] = useState<AdminActivitiesResponse | null>(null);
    const [type, setType] = useState<ActivityType | ''>('');
    const [actorId, setActorId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedActivity, setSelectedActivity] = useState<AdminUserActivity | null>(null);

    const loadActivities = async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            setResponse(await getAdminActivities({
                page,
                type: type || undefined,
                actorId: actorId.trim() || undefined,
            }));
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load activity.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        const loadInitialActivities = async () => {
            try {
                const activities = await getAdminActivities();
                if (!cancelled) setResponse(activities);
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load activity.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadInitialActivities();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleFilter = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void loadActivities();
    };

    const clearFilters = () => {
        setType('');
        setActorId('');
        setLoading(true);
        setError('');
        void getAdminActivities()
            .then(setResponse)
            .catch((err: unknown) => setError(getErrorMessage(err, 'Failed to load activity.')))
            .finally(() => setLoading(false));
    };

    const totalPages = response?.pagination.totalPages || 1;

    return (
        <div>
            <header className="mb-7">
                <span className="eyebrow"><Activity size={12} /> Administration</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Activity</h1>
                <p className="mt-2 text-slate-500">Review tracked actions for moderation and operational context.</p>
            </header>

            <form onSubmit={handleFilter} className="surface mb-6 grid gap-3 p-4 sm:grid-cols-[15rem_1fr_auto_auto]">
                <select
                    aria-label="Filter activity type"
                    value={type}
                    onChange={(event) => setType(event.target.value as ActivityType | '')}
                    className="soft-input px-4 text-sm text-slate-600 outline-none"
                >
                    <option value="">All activity types</option>
                    {activityOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                <input
                    aria-label="Filter actor ID"
                    value={actorId}
                    onChange={(event) => setActorId(event.target.value)}
                    placeholder="Actor user ID"
                    className="soft-input min-w-0 px-4 text-sm outline-none"
                />
                <button type="submit" className="primary-button" disabled={loading}><Search size={16} /> Apply</button>
                <button type="button" onClick={clearFilters} className="secondary-button" disabled={loading}>Clear</button>
            </form>

            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}

            {loading ? (
                <div className="surface p-6"><Skeleton active paragraph={{ rows: 7 }} /></div>
            ) : !response || response.items.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="No activity found" /></div>
            ) : (
                <>
                    <div className="surface overflow-x-auto">
                        <table className="w-full min-w-[56rem] text-left text-sm">
                            <thead className="border-b border-slate-100 text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Date/time</th>
                                    <th className="px-5 py-4 font-semibold">Actor</th>
                                    <th className="px-5 py-4 font-semibold">Action</th>
                                    <th className="px-5 py-4 font-semibold">Target/post</th>
                                    <th className="px-5 py-4 font-semibold">IP address</th>
                                    <th className="px-5 py-4 text-right font-semibold">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {response.items.map((activity) => (
                                    <tr key={activity._id} className="border-b border-slate-100 last:border-0">
                                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatActivityDate(activity.createdAt)}</td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-900">{activity.actor.name}</p>
                                            <p className="text-slate-500">{activity.actor.email}</p>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">{actionLabels[activity.type]}</td>
                                        <td className="px-5 py-4 text-slate-600">{getActivityTarget(activity)}</td>
                                        <td className="px-5 py-4 text-slate-600">{activity.ipAddress || '-'}</td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                aria-label={`View activity by ${activity.actor.name}`}
                                                onClick={() => setSelectedActivity(activity)}
                                                className="rounded-xl bg-slate-50 p-2 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-500">
                        <span>{response.pagination.total} activities</span>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => void loadActivities(response.pagination.page - 1)} disabled={loading || !response.pagination.hasPreviousPage} className="secondary-button !min-h-0 !py-2 disabled:opacity-50">Previous</button>
                            <span>Page {response.pagination.page} of {totalPages}</span>
                            <button type="button" onClick={() => void loadActivities(response.pagination.page + 1)} disabled={loading || !response.pagination.hasNextPage} className="secondary-button !min-h-0 !py-2 disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </>
            )}

            <Drawer
                title="Activity details"
                open={Boolean(selectedActivity)}
                onClose={() => setSelectedActivity(null)}
                width={460}
            >
                {selectedActivity && (
                    <div className="space-y-6 text-sm">
                        <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Actor</p>
                            <p className="font-semibold text-slate-900">{selectedActivity.actor.name}</p>
                            <p className="text-slate-500">{selectedActivity.actor.email}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Action</p>
                                <p className="text-slate-700">{actionLabels[selectedActivity.type]}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Occurred</p>
                                <p className="text-slate-700">{formatActivityDate(selectedActivity.createdAt)}</p>
                            </div>
                        </div>
                        <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">User agent</p>
                            <p className="break-words text-slate-700">{selectedActivity.userAgent || 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Metadata</p>
                            <pre className="overflow-auto rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-700">
                                {JSON.stringify(selectedActivity.metadata || {}, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
}
