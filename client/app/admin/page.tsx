'use client';

import { getAdminDashboard, getErrorMessage } from '@/app/api/api';
import { AdminDashboardResponse } from '@/app/types/user';
import { Empty, Skeleton } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import { MessagesSquare, Newspaper, Shield, UserRoundX, UsersRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const countCards = [
    { key: 'totalUsers', label: 'Total users', icon: UsersRound },
    { key: 'adminUsers', label: 'Admins', icon: Shield },
    { key: 'blockedUsers', label: 'Blocked users', icon: UserRoundX },
    { key: 'totalPosts', label: 'Total posts', icon: Newspaper },
    { key: 'totalComments', label: 'Comments', icon: MessagesSquare },
    { key: 'totalReplies', label: 'Replies', icon: MessagesSquare },
] as const;

export default function AdminDashboardPage() {
    const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const loadDashboard = async () => {
            try {
                const response = await getAdminDashboard();
                if (!cancelled) setDashboard(response);
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load dashboard.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadDashboard();
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return <div className="surface p-7"><Skeleton active paragraph={{ rows: 8 }} /></div>;
    }

    if (error || !dashboard) {
        return <div className="surface p-8 text-center text-rose-600">{error || 'Dashboard data is unavailable.'}</div>;
    }

    return (
        <div>
            <header className="mb-7">
                <span className="eyebrow"><Shield size={12} /> Administration</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Dashboard</h1>
                <p className="mt-2 text-slate-500">Review community activity and moderate content.</p>
            </header>

            <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {countCards.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="surface flex items-center justify-between p-5">
                        <div>
                            <p className="text-sm font-medium text-slate-500">{label}</p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{dashboard.counts[key]}</p>
                        </div>
                        <span className="rounded-2xl bg-indigo-50 p-3 text-indigo-600"><Icon size={21} /></span>
                    </div>
                ))}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="surface p-5 sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-900">Recent users</h2>
                        <Link href="/admin/users" className="text-sm font-semibold text-indigo-600">Manage users</Link>
                    </div>
                    {dashboard.recentUsers.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No recent users" />
                    ) : (
                        <div className="space-y-3">
                            {dashboard.recentUsers.map((user) => (
                                <Link key={user._id} href={`/admin/users/${user._id}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-indigo-50">
                                    <Image src={user.profilePic || '/DefaultAvatar.png'} alt="" width={38} height={38} className="rounded-full" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                                    </div>
                                    <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                <section className="surface p-5 sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-900">Recent posts</h2>
                        <Link href="/admin/posts" className="text-sm font-semibold text-indigo-600">Moderate posts</Link>
                    </div>
                    {dashboard.recentPosts.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No recent posts" />
                    ) : (
                        <div className="space-y-3">
                            {dashboard.recentPosts.map((post) => (
                                <Link key={post._id} href={`/admin/posts/${post._id}`} className="block rounded-2xl bg-slate-50 p-4 transition hover:bg-indigo-50">
                                    <div className="flex justify-between gap-3">
                                        <p className="truncate text-sm font-semibold text-slate-900">{post.title}</p>
                                        <span className="tag-pill !px-2 !py-0.5">{post.visibility}</span>
                                    </div>
                                    <p className="mt-2 truncate text-xs text-slate-500">{post.author?.name || 'Unknown author'}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
