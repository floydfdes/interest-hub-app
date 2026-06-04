'use client';

import {
    createSavedCollection,
    deleteSavedCollection,
    getBookmarkedPosts,
    getErrorMessage,
    getSavedCollectionPosts,
    getSavedCollections,
    removePostFromSavedCollection,
    updateSavedCollection,
} from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { IPost, Pagination, SavedCollection } from '@/app/types/user';
import { filterVisiblePosts } from '@/app/utils/moderation';
import { App, Empty, Skeleton } from 'antd';
import { Bookmark, Folder, Heart, MessageCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';

type SavedTab = 'all' | 'collections';

function SavedPostGrid({
    posts,
    emptyDescription,
    action,
}: {
    posts: IPost[];
    emptyDescription: string;
    action?: (post: IPost) => ReactNode;
}) {
    if (posts.length === 0) {
        return <div className="surface px-6 py-14"><Empty description={<span className="text-slate-500">{emptyDescription}</span>} /></div>;
    }

    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {posts.map((post) => {
                const postImage = post.image || '/default_image.png';
                return (
                    <div key={post._id} className="space-y-2">
                        <Link href={`/posts/${post._id}`} aria-label={post.title || 'Open post'} className="group relative block aspect-square overflow-hidden rounded-2xl bg-slate-100">
                            <Image
                                src={postImage}
                                alt={post.title || 'Saved post'}
                                fill
                                sizes="(max-width: 768px) 33vw, 280px"
                                unoptimized={postImage.startsWith('data:')}
                                className="object-cover transition duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-slate-950/70 to-transparent p-3 text-white opacity-0 transition group-hover:opacity-100">
                                <p className="truncate text-sm font-semibold">{post.title || 'Untitled post'}</p>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-slate-950/75 to-transparent p-3 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                                <span className="flex items-center gap-1"><Heart size={13} /> {post.likesCount ?? post.likes?.length ?? 0}</span>
                                <span className="flex items-center gap-1"><MessageCircle size={13} /> {post.commentsCount ?? post.comments?.length ?? 0}</span>
                            </div>
                        </Link>
                        {action?.(post)}
                    </div>
                );
            })}
        </div>
    );
}

export default function SavedPostsPage() {
    const currentUser = useCurrentUser();
    const currentUserId = currentUser?._id || '';
    const [tab, setTab] = useState<SavedTab>('all');
    const [posts, setPosts] = useState<IPost[]>([]);
    const [collections, setCollections] = useState<SavedCollection[]>([]);
    const [activeCollection, setActiveCollection] = useState<SavedCollection | null>(null);
    const [collectionPosts, setCollectionPosts] = useState<IPost[]>([]);
    const [collectionPagination, setCollectionPagination] = useState<Pagination | null>(null);
    const [collectionName, setCollectionName] = useState('');
    const [editingCollectionId, setEditingCollectionId] = useState('');
    const [editingName, setEditingName] = useState('');
    const [loading, setLoading] = useState(true);
    const [collectionLoading, setCollectionLoading] = useState(false);
    const [savingCollection, setSavingCollection] = useState(false);
    const [error, setError] = useState('');
    const { message } = App.useApp();

    useEffect(() => {
        if (!currentUserId) return;

        let cancelled = false;
        const loadSaved = async () => {
            try {
                const savedPosts = await getBookmarkedPosts();
                if (!cancelled) setPosts(filterVisiblePosts(savedPosts));
            } catch (err: unknown) {
                if (!cancelled) {
                    setPosts([]);
                    setError(getErrorMessage(err, 'Failed to load saved posts.'));
                }
            }

            try {
                const savedCollections = await getSavedCollections();
                if (!cancelled) setCollections(savedCollections);
            } catch {
                if (!cancelled) setCollections([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadSaved();
        return () => {
            cancelled = true;
        };
    }, [currentUserId]);

    const refreshCollections = async () => {
        try {
            setCollections(await getSavedCollections());
        } catch {
            setCollections([]);
        }
    };

    const openCollection = async (collection: SavedCollection) => {
        setActiveCollection(collection);
        setCollectionLoading(true);
        setError('');
        try {
            const response = await getSavedCollectionPosts(collection._id);
            setCollectionPosts(filterVisiblePosts(response.items));
            setCollectionPagination(response.pagination);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load collection posts.'));
        } finally {
            setCollectionLoading(false);
        }
    };

    const loadMoreCollectionPosts = async () => {
        if (!activeCollection || !collectionPagination?.hasNextPage) return;
        setCollectionLoading(true);
        try {
            const response = await getSavedCollectionPosts(activeCollection._id, collectionPagination.page + 1, collectionPagination.limit);
            setCollectionPosts((current) => [...current, ...filterVisiblePosts(response.items)]);
            setCollectionPagination(response.pagination);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load more collection posts.'));
        } finally {
            setCollectionLoading(false);
        }
    };

    const createCollection = async () => {
        const name = collectionName.trim();
        if (!name) return;

        setSavingCollection(true);
        setError('');
        try {
            const collection = await createSavedCollection(name);
            setCollections((current) => [collection, ...current]);
            setCollectionName('');
            message.success('Collection created');
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to create collection.'));
        } finally {
            setSavingCollection(false);
        }
    };

    const renameCollection = async (collection: SavedCollection) => {
        const name = editingName.trim();
        if (!name) return;

        setSavingCollection(true);
        setError('');
        try {
            const updated = await updateSavedCollection(collection._id, name);
            setCollections((current) => current.map((item) => item._id === updated._id ? updated : item));
            if (activeCollection?._id === updated._id) setActiveCollection(updated);
            setEditingCollectionId('');
            setEditingName('');
            message.success('Collection renamed');
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to rename collection.'));
        } finally {
            setSavingCollection(false);
        }
    };

    const removeCollection = async (collection: SavedCollection) => {
        setSavingCollection(true);
        setError('');
        try {
            await deleteSavedCollection(collection._id);
            setCollections((current) => current.filter((item) => item._id !== collection._id));
            if (activeCollection?._id === collection._id) {
                setActiveCollection(null);
                setCollectionPosts([]);
            }
            message.success('Collection deleted');
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to delete collection.'));
        } finally {
            setSavingCollection(false);
        }
    };

    const removeFromCollection = async (postId: string) => {
        if (!activeCollection) return;
        setError('');
        try {
            await removePostFromSavedCollection(activeCollection._id, postId);
            setCollectionPosts((current) => current.filter((post) => post._id !== postId));
            await refreshCollections();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to remove post from collection.'));
        }
    };

    if (!currentUser) {
        return (
            <div className="surface shell-container max-w-lg p-10 text-center">
                <h1 className="text-2xl font-semibold text-slate-900">Saved posts</h1>
                <p className="mt-3 text-slate-500">Log in to see your saved posts.</p>
                <Link href="/login" className="primary-button mt-7">Log in to continue</Link>
            </div>
        );
    }

    return (
        <div className="shell-container max-w-5xl">
            <header className="mb-8">
                <span className="eyebrow"><Bookmark size={12} /> Saved</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Your bookmarks</h1>
                <p className="mt-2 text-slate-500">Posts you saved for later, organized into collections.</p>
            </header>

            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}

            <div className="surface mb-6 flex gap-2 p-1.5">
                <button type="button" onClick={() => setTab('all')} aria-pressed={tab === 'all'} className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === 'all' ? 'bg-[#E9F2F9] text-[#1B325F]' : 'text-slate-500 hover:bg-slate-50'}`}>All saved</button>
                <button type="button" onClick={() => setTab('collections')} aria-pressed={tab === 'collections'} className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === 'collections' ? 'bg-[#E9F2F9] text-[#1B325F]' : 'text-slate-500 hover:bg-slate-50'}`}>Collections</button>
            </div>

            {loading ? (
                <div className="surface p-6"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
            ) : tab === 'all' ? (
                <SavedPostGrid posts={posts} emptyDescription="No saved posts yet." />
            ) : (
                <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
                    <aside className="space-y-4">
                        <div className="surface p-4">
                            <label className="text-sm font-semibold text-slate-800" htmlFor="collection-name">New collection</label>
                            <div className="mt-3 flex items-center gap-2">
                                <input id="collection-name" value={collectionName} onChange={(event) => setCollectionName(event.target.value)} className="soft-input h-11 min-w-0 flex-1 px-3 text-sm outline-none" placeholder="Travel" />
                                <button type="button" onClick={() => void createCollection()} disabled={savingCollection} className="secondary-button h-11 shrink-0 !min-h-0 !px-3" aria-label="Create collection"><Plus size={16} /></button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {collections.map((collection) => (
                                <div key={collection._id} className={`surface p-3 transition ${activeCollection?._id === collection._id ? 'bg-[#E9F2F9] ring-2 ring-[#9CC4E4]' : ''}`}>
                                    {editingCollectionId === collection._id ? (
                                        <div className="flex items-center gap-2">
                                            <input value={editingName} onChange={(event) => setEditingName(event.target.value)} className="soft-input h-10 min-w-0 flex-1 px-3 text-sm outline-none" />
                                            <button type="button" onClick={() => void renameCollection(collection)} disabled={savingCollection} className="secondary-button h-10 shrink-0 !min-h-0 !px-3">Save</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <button type="button" onClick={() => void openCollection(collection)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#1B325F] shadow-sm">
                                                    <Folder size={17} />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block truncate font-semibold text-slate-900">{collection.name}</span>
                                                    <span className="block text-xs text-slate-500">{collection.postsCount} posts</span>
                                                </span>
                                            </button>
                                            <div className="flex shrink-0 items-center gap-1">
                                                <button type="button" onClick={() => { setEditingCollectionId(collection._id); setEditingName(collection.name); }} className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label={`Rename ${collection.name}`}><Pencil size={14} /></button>
                                                <button type="button" onClick={() => void removeCollection(collection)} disabled={savingCollection} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label={`Delete ${collection.name}`}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </aside>
                    <section className="min-w-0">
                        {!activeCollection ? (
                            <div className="surface px-6 py-14"><Empty description="Select a collection" /></div>
                        ) : collectionLoading && collectionPosts.length === 0 ? (
                            <div className="surface p-6"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
                        ) : (
                            <div className="space-y-5">
                                <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-lg font-semibold text-slate-900">{activeCollection.name}</p>
                                        <p className="text-sm text-slate-500">{activeCollection.postsCount} posts in this collection</p>
                                    </div>
                                </div>
                                <SavedPostGrid
                                    posts={collectionPosts}
                                    emptyDescription="No posts in this collection"
                                    action={(post) => (
                                        <button type="button" onClick={() => void removeFromCollection(post._id)} className="secondary-button w-full !min-h-0 !py-2">Remove</button>
                                    )}
                                />
                                {collectionPagination?.hasNextPage && (
                                    <button type="button" onClick={() => void loadMoreCollectionPosts()} disabled={collectionLoading} className="secondary-button mx-auto flex">
                                        {collectionLoading ? 'Loading...' : 'Load more'}
                                    </button>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
