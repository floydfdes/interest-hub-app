"use client";

import { useEffect, useState } from "react";
import { Bookmark, Edit3, Eye, FileText, Grid3X3, LogOut, Settings, ShieldAlert } from "lucide-react";

import { useRouter } from "next/navigation";
import Avatar from "react-avatar";
import Image from "next/image";
import Link from "next/link";
import { getErrorMessage, getMe, getUserPosts } from "../api/api";
import { IPost, IUser, Pagination } from "../types/user";
import { notifyAuthChanged } from "../hooks/useCurrentUser";

export default function ProfilePage() {
    const [user, setUser] = useState<IUser | null>(null);
    const [posts, setPosts] = useState<IPost[]>([]);
    const [postsPagination, setPostsPagination] = useState<Pagination | null>(null);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [loadingMorePosts, setLoadingMorePosts] = useState(false);
    const [error, setError] = useState("");
    const [postsError, setPostsError] = useState("");
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("You must be logged in");

                const userData = await getMe() as { user: IUser };
                if (cancelled) return;

                setUser(userData.user);
                localStorage.setItem("user", JSON.stringify(userData.user));
                notifyAuthChanged();

                setLoadingPosts(true);
                try {
                    const response = await getUserPosts(userData.user._id);
                    if (!cancelled) {
                        setPosts(response.items);
                        setPostsPagination(response.pagination);
                    }
                } catch (err: unknown) {
                    if (!cancelled) setPostsError(getErrorMessage(err, "Failed to load your posts."));
                } finally {
                    if (!cancelled) setLoadingPosts(false);
                }
            } catch (err: unknown) {
                if (!cancelled) setError(err instanceof Error ? err.message : "Failed to fetch user");
            }
        };

        void fetchUser();
        return () => {
            cancelled = true;
        };
    }, []);

    const loadMorePosts = async () => {
        if (!user || !postsPagination?.hasNextPage) return;

        setLoadingMorePosts(true);
        setPostsError("");
        try {
            const response = await getUserPosts(user._id, postsPagination.page + 1, postsPagination.limit);
            setPosts((currentPosts) => {
                const existingIds = new Set(currentPosts.map((post) => post._id));
                return [...currentPosts, ...response.items.filter((post) => !existingIds.has(post._id))];
            });
            setPostsPagination(response.pagination);
        } catch (err: unknown) {
            setPostsError(getErrorMessage(err, "Failed to load more posts."));
        } finally {
            setLoadingMorePosts(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        notifyAuthChanged();
        setUser(null);
        router.push("/login");
    };

    if (error) {
        return (
            <div className="surface shell-container max-w-md p-10 text-center">
                <h1 className="mb-4 text-2xl font-semibold text-slate-900">Profile unavailable</h1>
                <p className="text-slate-500">{error}</p>
            </div>
        );
    }

    if (!user) {
        return <div className="surface shell-container max-w-4xl p-12 text-center text-slate-500">Loading profile...</div>;
    }

    const followersCount = user.followers?.length || user.followersCount || 0;
    const followingCount = user.following?.length || user.followingCount || 0;
    const pinnedPosts = posts.filter((post) => post.isPinned).sort((first, second) => new Date(second.pinnedAt || 0).getTime() - new Date(first.pinnedAt || 0).getTime());
    const profilePosts = [...pinnedPosts, ...posts.filter((post) => !post.isPinned)];
    const completion = user.profileCompletion;

    return (
        <div className="shell-container max-w-5xl">
            <section className="surface overflow-hidden p-0">
                <div className="h-36 bg-gradient-to-br from-[#1B325F] via-[#9CC4E4] to-[#E9F2F9] sm:h-44" />
                <div className="px-5 pb-6 sm:px-8 sm:pb-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end">
                            <div className="rounded-full bg-white p-1.5 shadow-xl">
                                <Avatar
                                    name={user.name}
                                    src={user.profilePic || undefined}
                                    round
                                    size="112"
                                    textSizeRatio={2}
                                />
                            </div>
                            <div className="pb-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{user.name}</h1>
                                    {user.isPrivate && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Private</span>}
                                </div>
                                <p className="mt-1 text-sm font-medium text-slate-500">{user.username ? `@${user.username}` : user.email}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => router.push("/profile/edit")} className="primary-button">
                                <Edit3 size={16} /> Edit profile
                            </button>
                            <button onClick={() => router.push("/profile/settings")} className="secondary-button">
                                <Settings size={16} /> Settings
                            </button>
                            <button onClick={handleLogout} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-100 px-4 text-sm font-semibold text-rose-500 transition hover:bg-rose-50">
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    </div>

                    {user.bio && <p className="mt-5 max-w-2xl whitespace-pre-line text-[0.96rem] leading-7 text-slate-700">{user.bio}</p>}

                    {user.interests?.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                            {user.interests.map((interest) => <span key={interest} className="tag-pill">{interest}</span>)}
                        </div>
                    )}

                    {completion && completion.percentage < 100 && (
                        <div className="mt-6 max-w-2xl rounded-2xl border border-[#9CC4E4]/50 bg-[#E9F2F9]/70 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-bold text-[#1B325F]">Profile {completion.percentage}% complete</p>
                                    {completion.missingFields.length > 0 && (
                                        <p className="mt-1 text-sm text-slate-500">Add {completion.missingFields.join(', ')} to complete your profile.</p>
                                    )}
                                </div>
                                <button type="button" onClick={() => router.push('/profile/edit')} className="secondary-button !min-h-0 !py-2">Update profile</button>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                                <div className="h-full rounded-full bg-[#1B325F]" style={{ width: `${completion.percentage}%` }} />
                            </div>
                        </div>
                    )}

                    <div className="mt-7 grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 text-center sm:max-w-xl">
                        <div className="p-4">
                            <p className="text-2xl font-bold text-slate-900">{profilePosts.length}</p>
                            <p className="text-sm text-slate-500">Posts</p>
                        </div>
                        <div className="border-x border-slate-100 p-4">
                            <p className="text-2xl font-bold text-slate-900">{followersCount}</p>
                            <p className="text-sm text-slate-500">Followers</p>
                        </div>
                        <div className="p-4">
                            <p className="text-2xl font-bold text-slate-900">{followingCount}</p>
                            <p className="text-sm text-slate-500">Following</p>
                        </div>
                    </div>
                </div>
            </section>

            <nav className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Profile shortcuts">
                <Link href={`/users/${user._id}`} className="surface flex items-center gap-3 p-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:text-[#1B325F]">
                    <Eye size={18} className="text-[#1B325F]" /> View public profile
                </Link>
                <Link href="/profile/drafts" className="surface flex items-center gap-3 p-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:text-[#1B325F]">
                    <FileText size={18} className="text-[#1B325F]" /> Drafts
                </Link>
                <Link href="/profile/review-posts" className="surface flex items-center gap-3 p-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:text-[#1B325F]">
                    <ShieldAlert size={18} className="text-[#1B325F]" /> Under review
                </Link>
                <Link href="/saved" className="surface flex items-center gap-3 p-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:text-[#1B325F]">
                    <Bookmark size={18} className="text-[#1B325F]" /> Saved posts
                </Link>
            </nav>

            <section className="mt-8">
                <div className="mb-5 flex items-center justify-center border-t border-slate-100 pt-5 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
                    <Grid3X3 size={15} className="mr-2" /> Posts
                </div>

                {postsError && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{postsError}</p>}

                {loadingPosts ? (
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {Array.from({ length: 9 }).map((_, index) => <div key={index} className="aspect-square rounded-2xl bg-slate-100" />)}
                    </div>
                ) : profilePosts.length === 0 ? (
                    <div className="surface px-6 py-16 text-center text-slate-500">
                        <p className="font-semibold text-slate-700">No posts yet</p>
                        <p className="mt-1 text-sm">Share your first interest and it will appear here.</p>
                        <button type="button" onClick={() => router.push("/create-post")} className="primary-button mx-auto mt-6">Create post</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {profilePosts.map((post) => {
                            const postImage = post.image || "/default_image.png";
                            return (
                                <Link key={post._id} href={`/posts/${post._id}`} aria-label={post.title || "Open post"} className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
                                    <Image
                                        src={postImage}
                                        alt={post.title || "Post image"}
                                        fill
                                        sizes="(max-width: 768px) 33vw, 320px"
                                        unoptimized={postImage.startsWith("data:")}
                                        className="object-cover transition duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-slate-950/70 to-transparent p-3 text-white opacity-0 transition group-hover:opacity-100">
                                        {post.isPinned && <span className="mb-2 inline-flex rounded-full bg-white/90 px-2 py-1 text-[0.68rem] font-semibold text-[#1B325F]">Pinned</span>}
                                        <p className="truncate text-sm font-semibold">{post.title}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {postsPagination?.hasNextPage && (
                    <button type="button" onClick={() => void loadMorePosts()} disabled={loadingMorePosts} className="secondary-button mx-auto mt-6 flex">
                        {loadingMorePosts ? "Loading..." : "Load more"}
                    </button>
                )}
            </section>
        </div>
    );
}
