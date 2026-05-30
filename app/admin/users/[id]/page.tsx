'use client';

import { getAdminUser, getErrorMessage } from '@/app/api/api';
import { AdminUserDetailResponse } from '@/app/types/user';
import { Empty, Skeleton } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Mail, Shield, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminUserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [detail, setDetail] = useState<AdminUserDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const loadUser = async () => {
            try {
                const response = await getAdminUser(id);
                if (!cancelled) setDetail(response);
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load user.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void loadUser();
        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) return <div className="surface p-7"><Skeleton active avatar paragraph={{ rows: 6 }} /></div>;
    if (error || !detail) return <div className="surface p-8 text-center text-rose-600">{error || 'User not found.'}</div>;

    const { user, posts } = detail;
    return (
        <div>
            <Link href="/admin/users" className="secondary-button mb-6"><ArrowLeft size={15} /> Back to users</Link>
            <section className="surface mb-7 p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <Image src={user.profilePic || '/DefaultAvatar.png'} alt="" width={76} height={76} className="rounded-full" />
                    <div className="min-w-0 flex-1">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{user.name}</h1>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                            <span className="flex items-center gap-1 capitalize"><Shield size={14} /> {user.role}</span>
                            <span className="flex items-center gap-1"><UserRound size={14} /> {user.isBlocked ? 'Blocked' : 'Active'}</span>
                        </div>
                    </div>
                </div>
                {user.bio && <p className="mt-5 text-sm leading-7 text-slate-600">{user.bio}</p>}
                <div className="mt-5 flex flex-wrap gap-2">
                    {user.interests?.map((interest) => <span key={interest} className="tag-pill">{interest}</span>)}
                </div>
                <p className="mt-5 text-xs text-slate-400">Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</p>
            </section>

            <section>
                <h2 className="mb-4 text-2xl font-semibold text-slate-900">Posts by this user</h2>
                {posts.length === 0 ? (
                    <div className="surface p-10"><Empty description="This user has no posts" /></div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {posts.map((post) => (
                            <Link key={post._id} href={`/admin/posts/${post._id}`} className="surface block p-5 transition hover:border-indigo-200">
                                <div className="flex justify-between gap-3">
                                    <h3 className="font-semibold text-slate-900">{post.title}</h3>
                                    <span className="tag-pill !px-2 !py-0.5">{post.visibility}</span>
                                </div>
                                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{post.content}</p>
                                <p className="mt-4 text-xs text-slate-400">{post.comments?.length || 0} comments</p>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
