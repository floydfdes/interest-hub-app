'use client';

import { bookmarkPost, removeBookmark } from '@/app/api/api';
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

    const handleBookmark = async () => {
        const nextBookmarked = !bookmarked;
        setBookmarked(nextBookmarked);
        setSaving(true);

        try {
            await (nextBookmarked ? bookmarkPost(postId) : removeBookmark(postId));
            onBookmarkChange?.(postId, nextBookmarked);
        } catch {
            setBookmarked(!nextBookmarked);
            message.error(nextBookmarked ? 'Failed to save post' : 'Failed to remove bookmark');
        } finally {
            setSaving(false);
        }
    };

    return (
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
    );
}
