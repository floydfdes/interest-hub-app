'use client';

import { addPostToSavedCollection, bookmarkPost, createSavedCollection, getErrorMessage, getSavedCollections, removeBookmark } from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { IUser, SavedCollection } from '@/app/types/user';
import { App, Button } from 'antd';
import { Bookmark, FolderPlus, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface BookmarkButtonProps {
    postId: string;
    currentUser?: IUser | null;
    initialBookmarked?: boolean;
    onBookmarkChange?: (postId: string, bookmarked: boolean) => void;
    showLabel?: boolean;
}

export default function BookmarkButton({
    postId,
    currentUser,
    initialBookmarked = false,
    onBookmarkChange,
    showLabel = false,
}: BookmarkButtonProps) {
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [saving, setSaving] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [collections, setCollections] = useState<SavedCollection[]>([]);
    const [newCollectionName, setNewCollectionName] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const { message } = App.useApp();
    const storedUser = useCurrentUser();
    const user = currentUser ?? storedUser;

    useEffect(() => {
        if (!menuOpen) return;

        let cancelled = false;
        getSavedCollections()
            .then((items) => { if (!cancelled) setCollections(items); })
            .catch(() => { if (!cancelled) setCollections([]); });

        const updateMenuPosition = () => {
            const rect = wrapperRef.current?.getBoundingClientRect();
            if (!rect) return;
            const menuWidth = 256;
            const left = Math.min(Math.max(12, rect.right - menuWidth), window.innerWidth - menuWidth - 12);
            setMenuPosition({ top: rect.bottom + 8, left });
        };

        const closeOnOutsideClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!menuRef.current?.contains(target) && !wrapperRef.current?.contains(target)) {
                setMenuOpen(false);
            }
        };

        updateMenuPosition();
        document.addEventListener('mousedown', closeOnOutsideClick);
        window.addEventListener('resize', updateMenuPosition);
        window.addEventListener('scroll', updateMenuPosition, true);
        return () => {
            cancelled = true;
            document.removeEventListener('mousedown', closeOnOutsideClick);
            window.removeEventListener('resize', updateMenuPosition);
            window.removeEventListener('scroll', updateMenuPosition, true);
        };
    }, [menuOpen]);

    if (!user) return null;

    const markSaved = () => {
        setBookmarked(true);
        onBookmarkChange?.(postId, true);
        setMenuOpen(false);
    };

    const saveNormally = async () => {
        setSaving(true);
        try {
            await bookmarkPost(postId);
            markSaved();
            message.success('Post saved');
        } catch (error: unknown) {
            message.error(getErrorMessage(error, 'Failed to save post'));
        } finally {
            setSaving(false);
        }
    };

    const saveToCollection = async (collectionId: string) => {
        if (!collectionId) return;
        setSaving(true);
        try {
            await addPostToSavedCollection(collectionId, postId);
            markSaved();
            message.success('Post saved to collection');
        } catch (error: unknown) {
            message.error(getErrorMessage(error, 'Failed to save post to collection'));
        } finally {
            setSaving(false);
        }
    };

    const createAndSaveToCollection = async () => {
        const name = newCollectionName.trim();
        if (!name) return;

        setSaving(true);
        try {
            const collection = await createSavedCollection(name);
            await addPostToSavedCollection(collection._id, postId);
            markSaved();
            setNewCollectionName('');
            message.success('Post saved to collection');
        } catch (error: unknown) {
            message.error(getErrorMessage(error, 'Failed to create collection'));
        } finally {
            setSaving(false);
        }
    };

    const removeSaved = async () => {
        setBookmarked(false);
        setSaving(true);

        try {
            await removeBookmark(postId);
            onBookmarkChange?.(postId, false);
        } catch {
            setBookmarked(true);
            message.error('Failed to remove bookmark');
        } finally {
            setSaving(false);
        }
    };

    const handleBookmark = async () => {
        if (bookmarked) {
            await removeSaved();
            return;
        }

        setMenuOpen((open) => !open);
    };

    return (
        <div ref={wrapperRef} className="relative inline-flex">
            <Button
                type="text"
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
                aria-expanded={menuOpen}
                data-testid={`bookmark-${postId}`}
                icon={<Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />}
                loading={saving}
                onClick={() => void handleBookmark()}
                className={`!flex !items-center !rounded-xl !px-3 ${
                    bookmarked ? '!bg-indigo-50 !text-indigo-600' : '!text-slate-500'
                }`}
            >
                {showLabel ? (bookmarked ? 'Saved' : 'Save') : null}
            </Button>

            {menuOpen && !bookmarked && typeof document !== 'undefined' && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[9999] w-64 rounded-2xl border border-slate-100 bg-white p-2 shadow-lg"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                >
                    <button
                        type="button"
                        onClick={() => void saveNormally()}
                        disabled={saving}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        <Bookmark size={15} /> Save normally
                    </button>

                    <div className="my-2 h-px bg-slate-100" />

                    <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Collections</p>
                    {collections.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-slate-500">No collections yet.</p>
                    ) : (
                        collections.map((collection) => (
                            <button
                                key={collection._id}
                                type="button"
                                onClick={() => void saveToCollection(collection._id)}
                                disabled={saving}
                                className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                                <span className="min-w-0 truncate"><FolderPlus size={15} className="mr-2 inline" />{collection.name}</span>
                                <span className="text-xs text-slate-400">{collection.postsCount}</span>
                            </button>
                        ))
                    )}

                    <div className="mt-2 flex gap-2 border-t border-slate-100 pt-2">
                        <input
                            value={newCollectionName}
                            onChange={(event) => setNewCollectionName(event.target.value)}
                            className="soft-input min-h-0 min-w-0 flex-1 px-3 py-2 text-sm outline-none"
                            placeholder="New collection"
                        />
                        <button
                            type="button"
                            onClick={() => void createAndSaveToCollection()}
                            disabled={saving || !newCollectionName.trim()}
                            className="rounded-xl bg-[#1B325F] px-3 text-white transition hover:bg-[#102446] disabled:opacity-50"
                            aria-label="Create collection and save"
                        >
                            <Plus size={15} />
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
