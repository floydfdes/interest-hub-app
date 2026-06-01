'use client';

import { clearAllNotifications, clearReadNotifications, deleteNotification, getErrorMessage, getNotifications, markAllNotificationsRead, markNotificationRead } from '@/app/api/api';
import { Pagination, UserNotification } from '@/app/types/user';
import { Avatar, Empty, Modal, Skeleton, message } from 'antd';
import { formatDistanceToNowStrict, isYesterday } from 'date-fns';
import { ArrowLeft, Bell, CheckCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function getNotificationMessage(notification: UserNotification) {
    const actorName = notification.actor?.name;
    if (!actorName) return notification.message;

    if (notification.type === 'post_liked') return `${actorName} liked your post.`;
    if (notification.type === 'user_followed') return `${actorName} followed you.`;
    if (notification.type === 'user_mentioned') return `${actorName} mentioned you.`;
    if (notification.type === 'post_shared') return `${actorName} shared a post with you.`;
    if (notification.type === 'profile_shared') return `${actorName} shared a profile with you.`;
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


function formatNotificationTime(date: string) {
    const createdAt = new Date(date);
    if (isYesterday(createdAt)) return 'Yesterday';

    return formatDistanceToNowStrict(createdAt, { addSuffix: true })
        .replace(/^about /, '')
        .replace(' hours', 'hrs')
        .replace(' hour', 'hr')
        .replace(' minutes', 'min')
        .replace(' minute', 'min')
        .replace(' seconds', 'sec')
        .replace(' second', 'sec')
        .replace(' days', 'days')
        .replace(' day', 'day')
        .replace(' months', 'months')
        .replace(' month', 'month')
        .replace(' years', 'yrs')
        .replace(' year', 'yr');
}


function markNotificationLocallyRead(notification: UserNotification, readAt: string) {
    return { ...notification, isRead: true, readAt };
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
    const [clearing, setClearing] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
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


    const refreshNotifications = async () => {
        const response = await getNotifications();
        setNotifications(response.items);
        setPagination(response.pagination);
        notifyNotificationsChanged();
    };

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
            if (!notification.isRead) {
                await markNotificationRead(notification._id);
                setNotifications((currentNotifications) => currentNotifications.map((item) => (
                    item._id === notification._id ? markNotificationLocallyRead(item, new Date().toISOString()) : item
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
            setNotifications((currentNotifications) => currentNotifications.map((notification) => (
                markNotificationLocallyRead(notification, notification.readAt || now)
            )));
            notifyNotificationsChanged();
            message.success('Notifications marked as read');
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to mark notifications as read.'));
        } finally {
            setMarkingAll(false);
        }
    };


    const removeNotification = async (notificationId: string) => {
        setDeletingId(notificationId);
        setError('');
        try {
            await deleteNotification(notificationId);
            await refreshNotifications();
            message.success('Notification deleted');
        } catch (err: unknown) {
            message.error(getErrorMessage(err, 'Failed to delete notification.'));
        } finally {
            setDeletingId(null);
        }
    };

    const clearRead = async () => {
        setClearing(true);
        setError('');
        try {
            const response = await clearReadNotifications();
            await refreshNotifications();
            message.success(`${response.deleted} read notification${response.deleted === 1 ? '' : 's'} cleared`);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to clear read notifications.'));
        } finally {
            setClearing(false);
        }
    };

    const clearAll = () => {
        Modal.confirm({
            title: 'Clear all notifications?',
            content: 'This will remove every notification from your inbox.',
            okText: 'Clear all',
            okButtonProps: { danger: true },
            cancelText: 'Cancel',
            async onOk() {
                setClearing(true);
                setError('');
                try {
                    const response = await clearAllNotifications();
                    await refreshNotifications();
                    message.success(`${response.deleted} notification${response.deleted === 1 ? '' : 's'} cleared`);
                } catch (err: unknown) {
                    setError(getErrorMessage(err, 'Failed to clear notifications.'));
                } finally {
                    setClearing(false);
                }
            },
        });
    };

    const unreadCount = notifications.filter((notification) => !notification.isRead).length;
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

            <header className="mb-7 space-y-5">
                <div>
                    <span className="eyebrow"><Bell size={12} /> Inbox</span>
                    <h1 className="gradient-heading mt-4 text-4xl font-bold">Notifications</h1>
                    <p className="mt-2 text-slate-500">Likes, follows, comments, replies, and moderation updates from your account.</p>
                    <p className="mt-3 text-sm font-semibold text-indigo-600">{unreadCount} unread</p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                        type="button"
                        onClick={() => void markAllRead()}
                        disabled={!hasUnread || markingAll || clearing}
                        className="secondary-button w-full !min-h-0 whitespace-nowrap !px-3 !py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <CheckCheck size={16} />
                        {markingAll ? 'Marking...' : 'Mark all as read'}
                    </button>
                    <button
                        type="button"
                        onClick={() => void clearRead()}
                        disabled={clearing || notifications.every((notification) => !notification.isRead)}
                        className="secondary-button w-full !min-h-0 whitespace-nowrap !px-3 !py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Clear read
                    </button>
                    <button
                        type="button"
                        onClick={clearAll}
                        disabled={clearing || notifications.length === 0}
                        className="secondary-button w-full !min-h-0 whitespace-nowrap !px-3 !py-2.5 !text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Trash2 size={16} />
                        Clear all
                    </button>
                </div>
            </header>

            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}

            {loading ? (
                <div className="surface p-6"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
            ) : notifications.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="No notifications yet" /></div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => {
                        return (
                            <div
                                key={notification._id}
                                className={`surface flex w-full items-center gap-3 p-3 transition hover:border-indigo-200 ${!notification.isRead ? 'border-indigo-200 bg-indigo-50/60' : 'bg-white/80'}`}
                            >
                                <button
                                    type="button"
                                    onClick={() => void openNotification(notification)}
                                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                >
                                    <span className="relative shrink-0">
                                        <Avatar src={notification.actor?.profilePic || null} size={42}>
                                            {notification.actor?.name?.charAt(0) || 'N'}
                                        </Avatar>
                                        {!notification.isRead && <span aria-label="Unread" className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-accent" />}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className={`block text-sm ${notification.isRead ? 'font-medium text-slate-600' : 'font-semibold text-slate-900'}`}>
                                            {getNotificationMessage(notification)}
                                        </span>
                                        {notification.post && <span className="mt-0.5 block truncate text-sm font-medium text-indigo-600">{notification.post.title}</span>}
                                        <span className="mt-1 block text-xs font-medium text-slate-400">
                                            {formatNotificationTime(notification.createdAt)}
                                        </span>
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    aria-label={`Delete notification ${notification._id}`}
                                    onClick={() => void removeNotification(notification._id)}
                                    disabled={deletingId === notification._id}
                                    className="ml-auto shrink-0 rounded-xl p-2 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Trash2 size={16} />
                                </button>
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
