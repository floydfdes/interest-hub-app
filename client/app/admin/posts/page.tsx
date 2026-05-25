'use client';

import { bulkDeleteAdminPosts, deleteAdminPost, getAdminPosts, getErrorMessage } from '@/app/api/api';
import { AdminPostsResponse, IPost } from '@/app/types/user';
import { App, Empty, Skeleton } from 'antd';
import { Eye, Newspaper, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import Swal from 'sweetalert2';

export default function AdminPostsPage() {
    const [response, setResponse] = useState<AdminPostsResponse | null>(null);
    const [query, setQuery] = useState('');
    const [authorId, setAuthorId] = useState('');
    const [visibility, setVisibility] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const { message } = App.useApp();

    const loadPosts = async (page = 1) => {
        setLoading(true);
        setError('');
        setSelectedIds(new Set());
        try {
            setResponse(await getAdminPosts(query.trim(), authorId.trim(), visibility, page));
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load posts.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        const loadInitialPosts = async () => {
            try {
                const posts = await getAdminPosts();
                if (!cancelled) setResponse(posts);
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load posts.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void loadInitialPosts();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void loadPosts();
    };

    const handleDelete = async (post: IPost) => {
        const result = await Swal.fire({
            title: 'Permanently delete post?',
            text: `"${post.title}" and all of its comments will be permanently deleted. This cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete permanently',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#e11d48',
        });
        if (!result.isConfirmed) return;

        try {
            await deleteAdminPost(post._id);
            message.success('Post permanently deleted');
            await loadPosts(response?.page || 1);
        } catch (err: unknown) {
            message.error(getErrorMessage(err, 'Failed to delete post.'));
        }
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;

        const result = await Swal.fire({
            title: 'Permanently delete selected posts?',
            text: 'This permanently deletes the selected posts and their comments. This cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete permanently',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#e11d48',
        });
        if (!result.isConfirmed) return;

        try {
            const deleted = await bulkDeleteAdminPosts(ids);
            message.success(`${deleted.deleted} ${deleted.deleted === 1 ? 'post' : 'posts'} deleted permanently.`);
            if (deleted.requested > deleted.deleted) {
                message.info('Some selected posts no longer existed.');
            }
            await loadPosts(response?.page || 1);
        } catch (err: unknown) {
            message.error(getErrorMessage(err, 'Failed to delete selected posts.'));
        }
    };

    const visibleIds = response?.posts.map((post) => post._id) || [];
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    const toggleSelection = (id: string, checked: boolean) => {
        setSelectedIds((current) => {
            const next = new Set(current);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    };
    const toggleVisibleSelection = (checked: boolean) => {
        setSelectedIds((current) => {
            const next = new Set(current);
            visibleIds.forEach((id) => {
                if (checked) next.add(id);
                else next.delete(id);
            });
            return next;
        });
    };
    const totalPages = response ? Math.max(1, Math.ceil(response.total / response.limit)) : 1;

    return (
        <div>
            <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <span className="eyebrow"><Newspaper size={12} /> Administration</span>
                    <h1 className="gradient-heading mt-4 text-4xl font-bold">Post moderation</h1>
                    <p className="mt-2 text-slate-500">Review posts and remove content when necessary.</p>
                </div>
                {selectedIds.size > 0 && (
                    <button type="button" onClick={() => void handleBulkDelete()} className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700">
                        <Trash2 size={16} className="mr-2 inline" /> Delete selected
                    </button>
                )}
            </header>

            <form onSubmit={handleSearch} className="surface mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_14rem_12rem_auto]">
                <input aria-label="Search posts" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search posts..." className="soft-input px-4 text-sm outline-none" />
                <input aria-label="Filter author ID" value={authorId} onChange={(event) => setAuthorId(event.target.value)} placeholder="Author ID" className="soft-input px-4 text-sm outline-none" />
                <select aria-label="Filter visibility" value={visibility} onChange={(event) => setVisibility(event.target.value)} className="soft-input px-4 text-sm text-slate-600 outline-none">
                    <option value="">All visibility</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="followersOnly">Followers only</option>
                </select>
                <button type="submit" className="primary-button" disabled={loading}><Search size={16} /> Search</button>
            </form>

            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}
            {loading ? (
                <div className="surface p-6"><Skeleton active paragraph={{ rows: 7 }} /></div>
            ) : !response || response.posts.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="No posts found" /></div>
            ) : (
                <>
                    <div className="surface overflow-x-auto">
                        <table className="w-full min-w-[48rem] text-left text-sm">
                            <thead className="border-b border-slate-100 text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">
                                        <input
                                            type="checkbox"
                                            aria-label="Select all visible posts"
                                            checked={allVisibleSelected}
                                            disabled={visibleIds.length === 0}
                                            onChange={(event) => toggleVisibleSelection(event.target.checked)}
                                        />
                                    </th>
                                    <th className="px-5 py-4 font-semibold">Post</th>
                                    <th className="px-5 py-4 font-semibold">Author</th>
                                    <th className="px-5 py-4 font-semibold">Visibility</th>
                                    <th className="px-5 py-4 font-semibold">Comments</th>
                                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {response.posts.map((post) => (
                                    <tr key={post._id} className="border-b border-slate-100 last:border-0">
                                        <td className="px-5 py-4">
                                            <input
                                                type="checkbox"
                                                aria-label={`Select ${post.title}`}
                                                checked={selectedIds.has(post._id)}
                                                onChange={(event) => toggleSelection(post._id, event.target.checked)}
                                            />
                                        </td>
                                        <td className="max-w-xs px-5 py-4">
                                            <p className="truncate font-semibold text-slate-900">{post.title}</p>
                                            <p className="truncate text-slate-500">{post.content}</p>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">{post.author?.name || 'Unknown'}</td>
                                        <td className="px-5 py-4"><span className="tag-pill !px-2 !py-0.5">{post.visibility}</span></td>
                                        <td className="px-5 py-4 text-slate-600">{post.comments?.length || 0}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/admin/posts/${post._id}`} aria-label={`View ${post.title}`} className="rounded-xl bg-slate-50 p-2 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"><Eye size={16} /></Link>
                                                <button type="button" aria-label={`Delete ${post.title}`} onClick={() => void handleDelete(post)} className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-500">
                        <span>{response.total} posts</span>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => void loadPosts(response.page - 1)} disabled={loading || response.page <= 1} className="secondary-button !min-h-0 !py-2 disabled:opacity-50">Previous</button>
                            <span>Page {response.page} of {totalPages}</span>
                            <button type="button" onClick={() => void loadPosts(response.page + 1)} disabled={loading || response.page >= totalPages} className="secondary-button !min-h-0 !py-2 disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
