'use client';

import { followUser, getErrorMessage, getUserPosts, getUserProfile, unfollowUser } from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { IPost, Pagination, PublicUserProfile } from '@/app/types/user';
import { Avatar, Empty, Skeleton } from 'antd';
import Image from 'next/image';
import { ArrowLeft, Flag, LockKeyhole, MessageCircle, MoreHorizontal, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ReportModal from '@/components/features/ReportModal';

export default function PublicProfilePage() {
    const { id } = useParams<{ id: string }>();
    const [profile, setProfile] = useState<PublicUserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [actionsOpen, setActionsOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [posts, setPosts] = useState<IPost[]>([]);
    const [postsPagination, setPostsPagination] = useState<Pagination | null>(null);
    const [postsLoading, setPostsLoading] = useState(false);
    const [postsLoadingMore, setPostsLoadingMore] = useState(false);
    const [postsError, setPostsError] = useState('');
    const actionMenuRef = useRef<HTMLDivElement>(null);
    const currentUser = useCurrentUser();

    useEffect(() => {
        let cancelled = false;
        const loadProfile = async () => {
            try {
                const nextProfile = await getUserProfile(id);
                if (cancelled) return;
                setProfile(nextProfile);

                if (nextProfile.canViewProfile) {
                    setPostsLoading(true);
                    setPostsError('');
                    try {
                        const response = await getUserPosts(id);
                        if (!cancelled) {
                            setPosts(response.items);
                            setPostsPagination(response.pagination);
                        }
                    } catch (err: unknown) {
                        if (!cancelled) {
                            if (nextProfile.posts) setPosts(nextProfile.posts);
                            setPostsError(getErrorMessage(err, 'Failed to load posts.'));
                        }
                    } finally {
                        if (!cancelled) setPostsLoading(false);
                    }
                }
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load profile.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void loadProfile();
        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        if (!actionsOpen) return;
        const closeMenu = (event: MouseEvent) => {
            if (!actionMenuRef.current?.contains(event.target as Node)) setActionsOpen(false);
        };
        document.addEventListener('mousedown', closeMenu);
        return () => document.removeEventListener('mousedown', closeMenu);
    }, [actionsOpen]);

    const toggleFollow = async () => {
        if (!profile) return;
        setUpdating(true);
        setError('');
        try {
            if (profile.isFollowing) {
                await unfollowUser(profile._id);
                setProfile({ ...profile, isFollowing: false, hasRequestedFollow: false });
            } else {
                const response = await followUser(profile._id);
                setProfile({
                    ...profile,
                    isFollowing: response.status !== 'requested',
                    hasRequestedFollow: response.status === 'requested',
                });
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to update follow status.'));
        } finally {
            setUpdating(false);
        }
    };


    const loadMorePosts = async () => {
        if (!postsPagination?.hasNextPage) return;

        setPostsLoadingMore(true);
        setPostsError('');
        try {
            const response = await getUserPosts(id, postsPagination.page + 1, postsPagination.limit);
            setPosts((currentPosts) => [...currentPosts, ...response.items]);
            setPostsPagination(response.pagination);
        } catch (err: unknown) {
            setPostsError(getErrorMessage(err, 'Failed to load more posts.'));
        } finally {
            setPostsLoadingMore(false);
        }
    };


    if (loading) {
        return <div className="surface shell-container max-w-2xl p-8"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>;
    }

    if (!profile) {
        return <div className="surface shell-container max-w-lg p-10 text-center text-slate-500">{error || 'Profile not found.'}</div>;
    }

    return (
        <div className="shell-container max-w-4xl">
            <Link href="/users" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <ArrowLeft size={15} /> Back to people
            </Link>
            <section className="surface p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                        <Avatar size={72} src={profile.profilePic || null}>{profile.name.charAt(0)}</Avatar>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
                            {profile.isPrivate && <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><LockKeyhole size={14} /> Private account</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void toggleFollow()}
                            disabled={updating || profile.hasRequestedFollow}
                            className={profile.isFollowing ? 'secondary-button' : 'primary-button'}
                        >
                            {profile.isFollowing ? 'Following' : profile.hasRequestedFollow ? 'Requested' : 'Follow'}
                        </button>
                        {currentUser && currentUser._id !== profile._id && (
                            <div ref={actionMenuRef} className="relative">
                                <button
                                    type="button"
                                    aria-label={`More actions for ${profile.name}`}
                                    aria-expanded={actionsOpen}
                                    onClick={() => setActionsOpen((open) => !open)}
                                    className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 transition hover:bg-slate-50"
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                {actionsOpen && (
                                    <div className="absolute right-0 top-14 z-10 min-w-32 rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActionsOpen(false);
                                                setReportOpen(true);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                                        >
                                            <Flag size={15} /> Report
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-600">{error}</p>}
                <div className="mt-7 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-4 text-center"><p className="text-2xl font-semibold text-slate-900">{profile.followersCount}</p><p className="text-sm text-slate-500">Followers</p></div>
                    <div className="rounded-xl bg-slate-50 p-4 text-center"><p className="text-2xl font-semibold text-slate-900">{profile.followingCount}</p><p className="text-sm text-slate-500">Following</p></div>
                    <div className="rounded-xl bg-slate-50 p-4 text-center"><p className="text-2xl font-semibold text-slate-900">{profile.postsCount}</p><p className="text-sm text-slate-500">Posts</p></div>
                </div>
                {!profile.canViewProfile ? (
                    <div className="mt-7 rounded-xl bg-slate-50 p-6 text-center text-slate-500">
                        This profile is private. Follow to view profile details.
                    </div>
                ) : (
                    <div className="mt-7 space-y-5">
                        {profile.bio && <p className="whitespace-pre-line rounded-xl bg-slate-50 p-4 text-slate-700">{profile.bio}</p>}
                        {profile.interests && profile.interests.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {profile.interests.map((interest) => <span key={interest} className="tag-pill">{interest}</span>)}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {profile.canViewProfile && (
                <section className="mt-6">
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Posts</h2>
                        <p className="mt-1 text-sm text-slate-500">A quick look at posts shared by {profile.name}.</p>
                    </div>

                    {postsError && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{postsError}</p>}

                    {postsLoading ? (
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="aspect-square rounded-2xl bg-slate-100" />
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="surface px-6 py-14"><Empty description={`${profile.name} has no visible posts yet`} /></div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            {posts.map((post) => {
                                const postImage = post.image || '/default_image.png';
                                return (
                                    <Link
                                        key={post._id}
                                        href={`/posts/${post._id}`}
                                        aria-label={post.title || 'Open post'}
                                        className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100"
                                    >
                                        <Image
                                            src={postImage}
                                            alt={post.title || 'Post image'}
                                            fill
                                            sizes="(max-width: 768px) 33vw, 280px"
                                            unoptimized={postImage.startsWith('data:')}
                                            className="object-cover transition duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-slate-950/70 to-transparent p-3 text-white opacity-0 transition group-hover:opacity-100">
                                            <p className="truncate text-sm font-semibold">{post.title}</p>
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-slate-950/75 to-transparent p-3 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                                            <span className="flex items-center gap-1"><ThumbsUp size={13} /> {post.likes?.length || 0}</span>
                                            <span className="flex items-center gap-1"><MessageCircle size={13} /> {post.comments?.length || 0}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {postsPagination?.hasNextPage && (
                        <button type="button" onClick={() => void loadMorePosts()} disabled={postsLoadingMore} className="secondary-button mx-auto mt-5">
                            {postsLoadingMore ? 'Loading...' : 'Load more posts'}
                        </button>
                    )}
                </section>
            )}

            {reportOpen && (
                <ReportModal
                    targetType="user"
                    targetId={profile._id}
                    targetLabel={profile.name}
                    onClose={() => setReportOpen(false)}
                />
            )}
        </div>
    );
}
