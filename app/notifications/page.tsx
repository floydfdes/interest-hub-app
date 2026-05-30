'use client';

import { getErrorMessage, getNotifications, markAllNotificationsRead, markNotificationRead } from '@/app/api/api';
import { Pagination, UserNotification } from '@/app/types/user';
import { Empty, Skeleton, message } from 'antd';
import { format } from 'date-fns';
import { ArrowLeft, Bell, CheckCheck, Heart, MessageCircle, ShieldAlert, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function getNotificationIcon(type: UserNotification['type']) {
    if (type === 'post_liked') return <Heart size={18} />;
    if (type === 'user_followed') return <UserPlus size={18} />;
    if (type === 'comment_created' || type === 'reply_created') return <MessageCircle size={18} />;
    if (type === 'moderation_review' || type === 'report_resolved') return <ShieldAlert size={18} />;
    return <Bell size={18} />;
}


function getNotificationMessage(notification: UserNotification) {
    const actorName = notification.actor?.name;
    if (!actorName) return notification.message;

    if (notification.type === 'post_liked') return `${actorName} liked your post.`;
    if (notification.type === 'user_followed') return `${actorName} followed you.`;
    if (notification.type === 'comment_created') return `${actorName} commented on your post.`;
    if (notification.type === 'reply_created') return `${actorName} replied to your comment.`;
    return notification.message.replace(/^Someone\b/i, actorName);
}

function getNotificationHref(notification: UserNotification) {
    if (notification.link) return notification.link;
    if (notification.post?._id) return `/posts/${notification.post._id}`;
    if (notification.targetUser?._id) return `/users/${notification.targetUser._id}`;
    if (notification.actor?._id) return `/users/${notification.actor._id}`;
    return null;
}

function notifyNotificationsChanged() {
    window.dispatchEvent(new Event('notifications:changed'));
}

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);
    const [error, setError] = useState('');
    const [requiresLogin, setRequiresLogin] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadNotifications = async () => {
            const hasToken = Boolean(localStorage.getItem('token'));
            await Promise.resolve();

            if (cancelled) return;
            if (!hasToken) {
                setRequiresLogin(true);
                setError('Log in to see your notifications.');
                setLoading(false);
                return;
            }

            try {
                const response = await getNotifications();
                if (!cancelled) {
                    setNotifications(response.items);
                    setPagination(response.pagination);
                }
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load notifications.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadNotifications();
        return () => {
            cancelled = true;
        };
    }, []);

    const loadMore = async () => {
        if (!pagination?.hasNextPage) return;

        setLoadingMore(true);
        setError('');
        try {
            const response = await getNotifications(pagination.page + 1, pagination.limit);
            setNotifications((currentNotifications) => [...currentNotifications, ...response.items]);
            setPagination(response.pagination);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load more notifications.'));
        } finally {
            setLoadingMore(false);
        }
    };

    const openNotification = async (notification: UserNotification) => {
        try {
            if (!notification.read) {
                await markNotificationRead(notification._id);
                setNotifications((currentNotifications) => currentNotifications.map((item) => (
                    item._id === notification._id ? { ...item, read: true, readAt: new Date().toISOString() } : item
                )));
                notifyNotificationsChanged();
            }

            const href = getNotificationHref(notification);
            if (href) router.push(href);
        } catch (err: unknown) {
            message.error(getErrorMessage(err, 'Failed to update notification.'));
        }
    };

    const markAllRead = async () => {
        setMarkingAll(true);
        setError('');
        try {
            await markAllNotificationsRead();
            const now = new Date().toISOString();
            setNotifications((currentNotifications) => currentNotifications.map((notification) => ({
                ...notification,
                read: true,
                readAt: notification.readAt || now,
            })));
            notifyNotificationsChanged();
            message.success('Notifications marked as read');
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to mark notifications as read.'));
        } finally {
            setMarkingAll(false);
        }
    };

    const unreadCount = notifications.filter((notification) => !notification.read).length;
    const hasUnread = unreadCount > 0;

    if (error && notifications.length === 0) {
        return (
            <div className="surface shell-container max-w-lg p-10 text-center">
                <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
                <p className="mt-3 text-slate-500">{error}</p>
                {requiresLogin && <Link href="/login" className="primary-button mt-7">Log in to continue</Link>}
            </div>
        );
    }

    return (
        <div className="shell-container max-w-3xl">
            <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <ArrowLeft size={15} /> Back to feed
            </Link>

            <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="eyebrow"><Bell size={12} /> Inbox</span>
                    <h1 className="gradient-heading mt-4 text-4xl font-bold">Notifications</h1>
                    <p className="mt-2 text-slate-500">Likes, follows, comments, replies, and moderation updates from your account.</p>
                    <p className="mt-3 text-sm font-semibold text-indigo-600">{unreadCount} unread</p>
                </div>
                <button
                    type="button"
                    onClick={() => void markAllRead()}
                    disabled={!hasUnread || markingAll}
                    className="secondary-button disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <CheckCheck size={16} />
                    {markingAll ? 'Marking...' : 'Mark all as read'}
                </button>
            </header>

            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}

            {loading ? (
                <div className="surface p-6"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
            ) : notifications.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="No notifications yet" /></div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => {
                        const href = getNotificationHref(notification);
                        return (
                            <button
                                key={notification._id}
                                type="button"
                                onClick={() => void openNotification(notification)}
                                className={`surface w-full p-4 text-left transition hover:border-indigo-200 ${!notification.read ? 'border-indigo-200 bg-indigo-50/60' : ''}`}
                            >
                                <div className="flex gap-4">
                                    <span className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${!notification.read ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {getNotificationIcon(notification.type)}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex flex-wrap items-center gap-2">
                                            {notification.title && <span className="font-semibold text-slate-900">{notification.title}</span>}
                                            {!notification.read && <span className="tag-pill !bg-indigo-600 !text-white">New</span>}
                                        </span>
                                        <span className="mt-1 block text-sm text-slate-600">{getNotificationMessage(notification)}</span>
                                        {notification.post && <span className="mt-2 block truncate text-sm font-medium text-indigo-600">{notification.post.title}</span>}
                                        <span className="mt-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                                            {format(new Date(notification.createdAt), 'MMM d, yyyy, h:mm a')}
                                            {href ? ' · Open' : ''}
                                        </span>
                                    </span>
                                </div>
                            </button>
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
