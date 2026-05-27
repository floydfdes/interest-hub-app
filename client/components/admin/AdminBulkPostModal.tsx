'use client';

import { bulkCreateAdminPosts, getAdminUsers, getErrorMessage } from '@/app/api/api';
import { AdminBulkPostInput, AdminUser, IPost } from '@/app/types/user';
import { App, Skeleton } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

interface AdminBulkPostModalProps {
    onClose: () => void;
    onSaved: () => void;
}

type PostRow = AdminBulkPostInput & {
    key: number;
    tagText: string;
    visibility: IPost['visibility'];
};

let nextPostRowKey = 1;

function newPostRow(): PostRow {
    return {
        key: nextPostRowKey++,
        author: '',
        title: '',
        content: '',
        image: '',
        category: '',
        tags: [],
        tagText: '',
        visibility: 'public',
    };
}

export default function AdminBulkPostModal({ onClose, onSaved }: AdminBulkPostModalProps) {
    const [rows, setRows] = useState<PostRow[]>([newPostRow()]);
    const [authors, setAuthors] = useState<AdminUser[]>([]);
    const [loadingAuthors, setLoadingAuthors] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const { message } = App.useApp();

    useEffect(() => {
        let cancelled = false;

        const loadAuthors = async () => {
            try {
                const firstPage = await getAdminUsers('', 1, 100);
                const users = [...firstPage.items];
                for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
                    const response = await getAdminUsers('', page, 100);
                    users.push(...response.items);
                }
                if (!cancelled) setAuthors(users);
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load authors.'));
            } finally {
                if (!cancelled) setLoadingAuthors(false);
            }
        };

        void loadAuthors();
        return () => {
            cancelled = true;
        };
    }, []);

    const updateRow = <K extends keyof PostRow>(key: number, field: K, value: PostRow[K]) => {
        setRows((current) => current.map((row) => row.key === key ? { ...row, [field]: value } : row));
    };

    const addRow = () => {
        if (rows.length >= 50) {
            setError('A batch can include at most 50 posts.');
            return;
        }
        setError('');
        setRows((current) => [...current, newPostRow()]);
    };

    const removeRow = (key: number) => {
        setRows((current) => current.length === 1 ? current : current.filter((row) => row.key !== key));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (rows.length > 50) {
            setError('A batch can include at most 50 posts.');
            return;
        }

        const posts = rows.map((row) => ({
            author: row.author.trim(),
            title: row.title.trim(),
            content: row.content.trim(),
            image: row.image.trim(),
            category: row.category.trim(),
            tags: row.tagText.split(',').map((tag) => tag.trim()).filter(Boolean),
            visibility: row.visibility,
        }));
        if (posts.some((post) => !post.author || !post.title || !post.content || !post.image || !post.category)) {
            setError('Every post needs an author, title, content, image, and category.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const created = await bulkCreateAdminPosts(posts);
            message.success(`${created.created} ${created.created === 1 ? 'post' : 'posts'} created.`);
            onSaved();
            onClose();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to create posts.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="surface max-h-[92vh] w-full max-w-6xl overflow-y-auto p-6 sm:p-7">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">Bulk add posts</h2>
                        <p className="mt-1 text-sm text-slate-500">Create up to 50 posts. Each post must belong to a valid existing user.</p>
                    </div>
                    <button type="button" onClick={addRow} disabled={saving || rows.length >= 50} className="secondary-button">
                        <Plus size={16} /> Add row
                    </button>
                </div>

                {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-600">{error}</p>}

                {loadingAuthors ? (
                    <div className="mt-6"><Skeleton active paragraph={{ rows: 4 }} /></div>
                ) : (
                    <div className="mt-6 space-y-4">
                        {rows.map((row, index) => (
                            <fieldset key={row.key} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <legend className="text-sm font-semibold text-slate-700">Post {index + 1}</legend>
                                    {rows.length > 1 && (
                                        <button type="button" aria-label={`Remove post ${index + 1}`} onClick={() => removeRow(row.key)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50">
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                        Author
                                        <select aria-label={`Post ${index + 1} author`} value={row.author} onChange={(event) => updateRow(row.key, 'author', event.target.value)} className="soft-input mt-2 w-full px-3 outline-none">
                                            <option value="">Select a user</option>
                                            {authors.map((author) => (
                                                <option key={author._id} value={author._id}>{author.name} ({author.email})</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                        Title
                                        <input aria-label={`Post ${index + 1} title`} value={row.title} onChange={(event) => updateRow(row.key, 'title', event.target.value)} className="soft-input mt-2 w-full px-3 outline-none" />
                                    </label>
                                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                        Category
                                        <input aria-label={`Post ${index + 1} category`} value={row.category} onChange={(event) => updateRow(row.key, 'category', event.target.value)} className="soft-input mt-2 w-full px-3 outline-none" />
                                    </label>
                                    <label className="text-sm font-medium text-slate-700">
                                        Visibility
                                        <select aria-label={`Post ${index + 1} visibility`} value={row.visibility} onChange={(event) => updateRow(row.key, 'visibility', event.target.value as IPost['visibility'])} className="soft-input mt-2 w-full px-3 outline-none">
                                            <option value="public">Public</option>
                                            <option value="private">Private</option>
                                            <option value="followersOnly">Followers only</option>
                                        </select>
                                    </label>
                                    <label className="text-sm font-medium text-slate-700">
                                        Tags
                                        <input aria-label={`Post ${index + 1} tags`} value={row.tagText} onChange={(event) => updateRow(row.key, 'tagText', event.target.value)} placeholder="typescript, api" className="soft-input mt-2 w-full px-3 outline-none" />
                                    </label>
                                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                        Content
                                        <textarea aria-label={`Post ${index + 1} content`} value={row.content} onChange={(event) => updateRow(row.key, 'content', event.target.value)} className="soft-input mt-2 min-h-24 w-full p-3 outline-none" />
                                    </label>
                                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                        Image data URI or base64
                                        <textarea aria-label={`Post ${index + 1} image`} value={row.image} onChange={(event) => updateRow(row.key, 'image', event.target.value)} className="soft-input mt-2 min-h-24 w-full p-3 outline-none" />
                                    </label>
                                </div>
                            </fieldset>
                        ))}
                    </div>
                )}

                <div className="mt-7 flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="secondary-button">Cancel</button>
                    <button type="submit" disabled={saving || loadingAuthors || authors.length === 0} className="primary-button">{saving ? 'Creating...' : `Create ${rows.length} ${rows.length === 1 ? 'post' : 'posts'}`}</button>
                </div>
            </form>
        </div>
    );
}
