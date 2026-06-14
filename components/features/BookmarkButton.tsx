'use client';

import { bookmarkPost, getErrorMessage, removeBookmark } from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { IUser } from '@/app/types/user';
import { App, Button } from 'antd';
import { Bookmark } from 'lucide-react';
import { useState } from 'react';

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
    const { message } = App.useApp();
    const storedUser = useCurrentUser();
    const user = currentUser ?? storedUser;

    if (!user) return null;

    const markSaved = () => {
        setBookmarked(true);
        onBookmarkChange?.(postId, true);
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

        await saveNormally();
    };

    return (
        <div className="relative inline-flex">
            <Button
                type="text"
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
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
        </div>
    );
}
