'use client';

import { getErrorMessage, getMyActivities } from '@/app/api/api';
import { ActivityType, Pagination, UserActivity } from '@/app/types/user';
import { Empty, Skeleton } from 'antd';
import { format } from 'date-fns';
import { Activity, ArrowLeft, Heart, LogIn, NotebookPen, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const activityFilters: Array<{ value: ActivityType | ''; label: string }> = [
    { value: '', label: 'All' },
    { value: 'login', label: 'Logins' },
    { value: 'post_created', label: 'Posts Created' },
    { value: 'post_liked', label: 'Likes' },
    { value: 'user_followed', label: 'Following' },
];

const activityLabels: Record<ActivityType, string> = {
    login: 'Logged in',
    post_created: 'Created a post',
    user_followed: 'Followed a user',
    post_liked: 'Liked a post',
    report_submitted: 'Submitted a report',
    user_blocked: 'Blocked a user',
    user_unblocked: 'Unblocked a user',
};

function ActivityIcon({ type }: { type: ActivityType }) {
    if (type === 'login') return <LogIn size={18} />;
    if (type === 'post_created') return <NotebookPen size={18} />;
    if (type === 'post_liked') return <Heart size={18} />;
    if (type === 'user_followed') return <UserPlus size={18} />;
    return <Activity size={18} />;
}

function formatActivityDate(date: string) {
    return format(new Date(date), 'MMM d, yyyy, h:mm a');
}

function ActivitySubject({ activity }: { activity: UserActivity }) {
    if (activity.post) {
        return (
            <Link href={`/posts/${activity.post._id}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                {activity.post.title}
            </Link>
        );
    }

    if (activity.targetUser) {
        return <span className="font-medium text-slate-700">{activity.targetUser.name}</span>;
    }

    return null;
}

export default function MyActivitiesPage() {
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [type, setType] = useState<ActivityType | ''>('');
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [requiresLogin, setRequiresLogin] = useState(false);

    const loadActivities = async (nextType: ActivityType | '' = type) => {
        setLoading(true);
        setError('');
        try {
            const response = await getMyActivities({ type: nextType || undefined });
            setActivities(response.items);
            setPagination(response.pagination);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load your activity.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        const loadInitialActivities = async () => {
            const hasToken = Boolean(localStorage.getItem('token'));
            await Promise.resolve();

            if (cancelled) return;
            if (!hasToken) {
                setRequiresLogin(true);
                setError('Log in to see your activity.');
                setLoading(false);
                return;
            }

            try {
                const response = await getMyActivities();
                if (!cancelled) {
                    setActivities(response.items);
                    setPagination(response.pagination);
                }
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load your activity.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadInitialActivities();
        return () => {
            cancelled = true;
        };
    }, []);

    const selectFilter = (nextType: ActivityType | '') => {
        setType(nextType);
        void loadActivities(nextType);
    };

    const loadMore = async () => {
        if (!pagination?.hasNextPage) return;

        setLoadingMore(true);
        setError('');
        try {
            const response = await getMyActivities({
                page: pagination.page + 1,
                limit: pagination.limit,
                type: type || undefined,
            });
            setActivities((currentActivities) => [...currentActivities, ...response.items]);
            setPagination(response.pagination);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load more activity.'));
        } finally {
            setLoadingMore(false);
        }
    };

    if (error && activities.length === 0) {
        return (
            <div className="surface shell-container max-w-lg p-10 text-center">
                <h1 className="text-2xl font-semibold text-slate-900">Your activity</h1>
                <p className="mt-3 text-slate-500">{error}</p>
                {requiresLogin && <Link href="/login" className="primary-button mt-7">Log in to continue</Link>}
            </div>
        );
    }

    return (
        <div className="shell-container max-w-3xl">
            <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <ArrowLeft size={15} /> Back to profile
            </Link>

            <header className="mb-7">
                <span className="eyebrow"><Activity size={12} /> Profile</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Your activity</h1>
                <p className="mt-2 text-slate-500">A private timeline of actions from your account.</p>
            </header>

            <div className="surface mb-6 flex flex-wrap gap-2 p-3" aria-label="Activity filters">
                {activityFilters.map((filter) => (
                    <button
                        key={filter.value || 'all'}
                        type="button"
                        aria-pressed={type === filter.value}
                        onClick={() => selectFilter(filter.value)}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            type === filter.value
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                        }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}

            {loading ? (
                <div className="surface p-6"><Skeleton active paragraph={{ rows: 5 }} /></div>
            ) : activities.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="No activity found" /></div>
            ) : (
                <div className="space-y-3">
                    {activities.map((activity) => (
                        <article key={activity._id} className="surface flex gap-4 p-4 sm:p-5">
                            <span className="mt-1 rounded-xl bg-indigo-50 p-3 text-indigo-600">
                                <ActivityIcon type={activity.type} />
                            </span>
                            <div className="min-w-0">
                                <p className="font-semibold text-slate-900">{activityLabels[activity.type]}</p>
                                {(activity.post || activity.targetUser) && (
                                    <p className="mt-1 text-sm text-slate-500">
                                        <ActivitySubject activity={activity} />
                                    </p>
                                )}
                                <p className="mt-2 text-xs text-slate-400">{formatActivityDate(activity.createdAt)}</p>
                            </div>
                        </article>
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
