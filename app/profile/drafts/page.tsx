'use client';

import { getDraftPosts, getErrorMessage, publishDraftPost, updateDraftPost } from '@/app/api/api';
import { resizeImageToBase64 } from '@/app/api/imageUtil';
import { IPost, Pagination } from '@/app/types/user';
import { parseAndValidateTags } from '@/app/utils/postTags';
import { Empty, Skeleton } from 'antd';
import { ArrowLeft, Edit, FileText, ImagePlus, Send, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const categories = ['Tech', 'Health', 'Travel', 'Design', 'Education'];
const visibilities: Array<{ value: IPost['visibility']; label: string }> = [
    { value: 'public', label: 'Public' },
    { value: 'followersOnly', label: 'Followers only' },
    { value: 'private', label: 'Only me' },
];

type DraftForm = {
    title: string;
    content: string;
    category: string;
    image: string;
    tags: string;
    visibility: IPost['visibility'];
};

function draftToForm(post: IPost): DraftForm {
    return {
        title: post.title || '',
        content: post.content || '',
        category: post.category || '',
        image: post.image || '',
        tags: (post.tags || []).join(', '),
        visibility: post.visibility || 'public',
    };
}

export default function DraftPostsPage() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [posts, setPosts] = useState<IPost[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [editingPost, setEditingPost] = useState<IPost | null>(null);
    const [form, setForm] = useState<DraftForm | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [updatingId, setUpdatingId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const loadDrafts = async () => {
            try {
                const response = await getDraftPosts();
                if (!cancelled) {
                    setPosts(response.items);
                    setPagination(response.pagination);
                }
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load drafts.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void loadDrafts();
        return () => {
            cancelled = true;
        };
    }, []);

    const startEditing = (post: IPost) => {
        setEditingPost(post);
        setForm(draftToForm(post));
        setError('');
    };

    const updateField = (field: keyof DraftForm, value: string) => {
        setForm((current) => current ? { ...current, [field]: value } : current);
    };

    const uploadDraftImage = async (file: File) => {
        setError('');
        const image = await resizeImageToBase64(file, 900, 540);
        if (!image) {
            setError('We could not process that image. Please try another file.');
            return;
        }
        updateField('image', image);
    };

    const saveDraft = async () => {
        if (!editingPost || !form) return;
        const { tags, error: tagError } = parseAndValidateTags(form.tags);
        if (tagError) {
            setError(tagError);
            return;
        }

        setUpdatingId(editingPost._id);
        setError('');
        try {
            const updated = await updateDraftPost(editingPost._id, {
                title: form.title,
                content: form.content,
                category: form.category,
                image: form.image,
                tags,
                visibility: form.visibility,
            });
            setPosts((current) => current.map((post) => post._id === updated._id ? updated : post));
            setEditingPost(updated);
            setForm(draftToForm(updated));
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to save draft.'));
        } finally {
            setUpdatingId('');
        }
    };

    const publishDraft = async (post: IPost) => {
        const missingFields = [
            !post.title?.trim() ? 'title' : '',
            !post.content?.trim() ? 'content' : '',
            !post.category?.trim() ? 'category' : '',
            !post.image?.trim() ? 'image' : '',
        ].filter(Boolean);

        if (missingFields.length > 0) {
            setError(`Draft is missing required fields: ${missingFields.join(', ')}.`);
            return;
        }

        setUpdatingId(post._id);
        setError('');
        try {
            await publishDraftPost(post._id);
            setPosts((current) => current.filter((item) => item._id !== post._id));
            if (editingPost?._id === post._id) {
                setEditingPost(null);
                setForm(null);
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to publish draft.'));
        } finally {
            setUpdatingId('');
        }
    };

    const publishEditingDraft = async () => {
        if (!editingPost || !form) return;

        const { tags, error: tagError } = parseAndValidateTags(form.tags);
        if (tagError) {
            setError(tagError);
            return;
        }

        const missingFields = [
            !form.title.trim() ? 'title' : '',
            !form.content.trim() ? 'content' : '',
            !form.category.trim() ? 'category' : '',
            !form.image.trim() ? 'image' : '',
        ].filter(Boolean);

        if (missingFields.length > 0) {
            setError(`Draft is missing required fields: ${missingFields.join(', ')}.`);
            return;
        }

        setUpdatingId(editingPost._id);
        setError('');
        try {
            const updated = await updateDraftPost(editingPost._id, {
                title: form.title,
                content: form.content,
                category: form.category,
                image: form.image,
                tags,
                visibility: form.visibility,
            });
            await publishDraftPost(updated._id);
            setPosts((current) => current.filter((item) => item._id !== updated._id));
            setEditingPost(null);
            setForm(null);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to publish draft.'));
        } finally {
            setUpdatingId('');
        }
    };

    const loadMore = async () => {
        if (!pagination?.hasNextPage) return;
        setLoadingMore(true);
        setError('');
        try {
            const response = await getDraftPosts(pagination.page + 1, pagination.limit);
            setPosts((current) => [...current, ...response.items]);
            setPagination(response.pagination);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load more drafts.'));
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <div className="shell-container max-w-4xl">
            <Link href="/profile/settings" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <ArrowLeft size={15} /> Back to settings
            </Link>
            <header className="mb-7">
                <span className="eyebrow"><FileText size={12} /> Profile</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Draft posts</h1>
                <p className="mt-2 text-slate-500">Save unfinished posts privately and publish them when ready.</p>
            </header>

            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}

            {form && editingPost && (
                <section className="surface mb-6 p-5 sm:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Edit draft</h2>
                            <p className="mt-1 text-sm text-slate-500">Draft fields can stay incomplete until publish.</p>
                        </div>
                        <button type="button" onClick={() => { setEditingPost(null); setForm(null); }} className="secondary-button !min-h-0 !py-2">Close</button>
                    </div>
                    <div className="grid gap-4">
                        <input value={form.title} onChange={(event) => updateField('title', event.target.value)} className="soft-input px-4 outline-none" placeholder="Title" />
                        <textarea value={form.content} onChange={(event) => updateField('content', event.target.value)} className="soft-input min-h-32 resize-none p-4 outline-none" placeholder="Content" />
                        <select value={form.category} onChange={(event) => updateField('category', event.target.value)} className="soft-input px-4 outline-none">
                            <option value="">Select Category</option>
                            {categories.map((category) => <option key={category}>{category}</option>)}
                        </select>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Cover image</p>
                                    <p className="mt-1 text-xs text-slate-500">Required before publishing. Uploading is safer than pasting a URL.</p>
                                </div>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="secondary-button !min-h-0 !py-2">
                                    <Upload size={15} /> Upload image
                                </button>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) void uploadDraftImage(file);
                                    event.target.value = '';
                                }}
                            />
                            {form.image ? (
                                <div className="relative h-44 overflow-hidden rounded-xl bg-slate-100">
                                    <Image src={form.image} alt="Draft cover preview" fill className="object-cover" unoptimized={form.image.startsWith('data:')} />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-slate-500">
                                    <ImagePlus size={16} /> No cover selected yet.
                                </div>
                            )}
                            <input value={form.image} onChange={(event) => updateField('image', event.target.value)} className="soft-input mt-3 w-full px-4 outline-none" placeholder="Or paste image URL, base64, or data URI" />
                        </div>
                        <input value={form.tags} onChange={(event) => updateField('tags', event.target.value)} className="soft-input px-4 outline-none" placeholder="Tags, comma separated" />
                        <select value={form.visibility} onChange={(event) => updateField('visibility', event.target.value as IPost['visibility'])} className="soft-input px-4 outline-none">
                            {visibilities.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                    </div>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button type="button" onClick={() => void saveDraft()} disabled={updatingId === editingPost._id} className="secondary-button">
                            {updatingId === editingPost._id ? 'Saving...' : 'Save draft'}
                        </button>
                        <button type="button" onClick={() => void publishEditingDraft()} disabled={updatingId === editingPost._id} className="primary-button">
                            <Send size={15} /> {updatingId === editingPost._id ? 'Publishing...' : 'Publish'}
                        </button>
                    </div>
                </section>
            )}

            {loading ? (
                <div className="surface p-6"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
            ) : posts.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="You have no drafts" /></div>
            ) : (
                <div className="space-y-3">
                    {posts.map((post) => (
                        <div key={post._id} className="surface flex items-center gap-4 p-4 sm:p-5">
                            <Image src={post.image || '/default_image.png'} alt="" width={72} height={56} className="h-14 w-[4.5rem] rounded-xl object-cover" />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate font-semibold text-slate-900">{post.title || 'Untitled draft'}</p>
                                    <span className="tag-pill !bg-slate-100 !text-slate-600">Draft</span>
                                </div>
                                <p className="truncate text-sm text-slate-500">{post.category || 'No category yet'}</p>
                            </div>
                            <button type="button" onClick={() => startEditing(post)} className="secondary-button !min-h-0 !py-2">
                                <Edit size={15} /> Edit
                            </button>
                            <button type="button" onClick={() => void publishDraft(post)} disabled={updatingId === post._id} className="primary-button !min-h-0 !py-2 disabled:opacity-50">
                                {updatingId === post._id ? 'Publishing...' : 'Publish'}
                            </button>
                        </div>
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
