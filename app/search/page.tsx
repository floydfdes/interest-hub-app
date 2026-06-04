"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Avatar, Empty, Skeleton } from "antd";
import { Hash, MessageCircle, Search, ThumbsUp, UserRound } from "lucide-react";
import { globalSearch, getErrorMessage } from "@/app/api/api";
import { GlobalSearchResponse } from "@/app/types/user";

const emptyResults: GlobalSearchResponse = {
    query: "",
    users: [],
    posts: [],
    tags: [],
};

export default function GlobalSearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams?.get("query") || searchParams?.get("q") || "";
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<GlobalSearchResponse>(emptyResults);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hasSearched, setHasSearched] = useState(false);

    const runSearch = async (nextQuery: string) => {
        const trimmedQuery = nextQuery.trim();
        if (trimmedQuery.length < 2) {
            setError("Enter at least 2 characters to search.");
            setResults(emptyResults);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        setError("");
        setHasSearched(true);
        try {
            const response = await globalSearch(trimmedQuery, 5);
            setResults(response);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Failed to search."));
            setResults({ ...emptyResults, query: trimmedQuery });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialQuery.trim().length < 2) return;

        const timeout = window.setTimeout(() => {
            void runSearch(initialQuery);
        }, 0);

        return () => window.clearTimeout(timeout);
    }, [initialQuery]);

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedQuery = query.trim();
        if (trimmedQuery.length >= 2) router.push(`/search?query=${encodeURIComponent(trimmedQuery)}`);
        void runSearch(trimmedQuery);
    };

    const hasResults = results.users.length > 0 || results.posts.length > 0 || results.tags.length > 0;

    return (
        <div className="shell-container max-w-5xl">
            <header className="mb-8">
                <span className="eyebrow"><Search size={12} /> Search</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Search InterestHub</h1>
                <p className="mt-2 text-slate-500">Find people, posts, and tags from one place.</p>
            </header>

            <form onSubmit={submitSearch} className="surface mb-7 flex flex-col gap-3 p-4 sm:flex-row">
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search users, posts, or tags..."
                    className="soft-input min-w-0 flex-1 px-4 text-sm outline-none"
                    aria-label="Global search"
                />
                <button type="submit" className="primary-button" disabled={loading}>
                    <Search size={16} /> {loading ? "Searching..." : "Search"}
                </button>
            </form>

            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}

            {loading ? (
                <div className="grid gap-5 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => <div key={index} className="surface p-5"><Skeleton active paragraph={{ rows: 5 }} /></div>)}
                </div>
            ) : !hasSearched ? (
                <div className="surface px-6 py-16 text-center text-slate-500">
                    <Search className="mx-auto mb-4 text-slate-300" size={34} />
                    <p className="font-semibold text-slate-700">Search across the whole app</p>
                    <p className="mt-1 text-sm">Try a topic like travel, design, or photography.</p>
                </div>
            ) : !hasResults ? (
                <div className="surface px-6 py-16"><Empty description={`No results for ${results.query || query}`} /></div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr_0.8fr]">
                    <section className="surface p-5">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900"><UserRound size={18} /> Users</h2>
                        {results.users.length === 0 ? <p className="text-sm text-slate-500">No users found.</p> : (
                            <div className="space-y-3">
                                {results.users.map((user) => (
                                    <Link key={user._id} href={`/users/${user._id}`} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50">
                                        <Avatar src={user.profilePic || null} size={42}>{user.name.charAt(0)}</Avatar>
                                        <span className="min-w-0">
                                            <span className="block truncate font-semibold text-slate-900">{user.name}</span>
                                            <span className="block truncate text-sm text-slate-500">{user.username ? `@${user.username}` : user.email}</span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="surface p-5">
                        <h2 className="mb-4 text-lg font-bold text-slate-900">Posts</h2>
                        {results.posts.length === 0 ? <p className="text-sm text-slate-500">No posts found.</p> : (
                            <div className="space-y-3">
                                {results.posts.map((post) => {
                                    const postImage = post.image || "/default_image.png";
                                    return (
                                        <Link key={post._id} href={`/posts/${post._id}`} className="flex gap-3 rounded-2xl p-2 transition hover:bg-slate-50">
                                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                                                <Image src={postImage} alt={post.title || "Post"} fill sizes="80px" unoptimized={postImage.startsWith("data:")} className="object-cover" />
                                            </div>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate font-semibold text-slate-900">{post.title}</span>
                                                <span className="mt-1 block line-clamp-2 text-sm text-slate-500">{post.content}</span>
                                                <span className="mt-2 flex items-center gap-3 text-xs font-semibold text-slate-400">
                                                    <span className="flex items-center gap-1"><ThumbsUp size={12} /> {post.likesCount ?? 0}</span>
                                                    <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.commentsCount ?? 0}</span>
                                                </span>
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <section className="surface p-5">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900"><Hash size={18} /> Tags</h2>
                        {results.tags.length === 0 ? <p className="text-sm text-slate-500">No tags found.</p> : (
                            <div className="flex flex-wrap gap-2">
                                {results.tags.map((tag) => (
                                    <Link key={tag.tag} href={`/search?query=${encodeURIComponent(tag.tag)}`} className="tag-pill">
                                        #{tag.tag}<span className="ml-1 text-xs text-slate-400">{tag.postsCount}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
