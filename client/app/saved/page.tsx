'use client';

import { getBookmarkedPosts, getErrorMessage } from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { IPost } from '@/app/types/user';
import PostCard from '@/components/features/PostCard';
import { Empty, Skeleton } from 'antd';
import { Bookmark } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SavedPostsPage() {
    const currentUser = useCurrentUser();
    const [posts, setPosts] = useState<IPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!currentUser) return;

        const loadBookmarks = async () => {
            try {
                setPosts(await getBookmarkedPosts());
            } catch (err: unknown) {
                setError(getErrorMessage(err, 'Failed to load saved posts.'));
            } finally {
                setLoading(false);
            }
        };

        void loadBookmarks();
    }, [currentUser]);

    const handleBookmarkChange = (postId: string, bookmarked: boolean) => {
        if (!bookmarked) {
            setPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
        }
    };

    const handleHide = (postId: string) => {
        setPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
    };

    if (!currentUser || error) {
        return (
            <div className="surface shell-container max-w-lg p-10 text-center">
                <h1 className="text-2xl font-semibold text-slate-900">Saved posts</h1>
                <p className="mt-3 text-slate-500">{error || 'Log in to see your saved posts.'}</p>
                {!currentUser && <Link href="/login" className="primary-button mt-7">Log in to continue</Link>}
            </div>
        );
    }

    return (
        <div className="shell-container max-w-3xl">
            <header className="mb-8">
                <span className="eyebrow"><Bookmark size={12} /> Saved</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Your bookmarks</h1>
                <p className="mt-2 text-slate-500">Posts you saved for later.</p>
            </header>

            {loading ? (
                <div className="surface p-6"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
            ) : posts.length === 0 ? (
                <div className="surface px-6 py-14">
                    <Empty description={<span className="text-slate-500">No saved posts yet.</span>} />
                </div>
            ) : (
                <div className="space-y-5">
                    {posts.map((post) => (
                        <PostCard
                            key={post._id}
                            post={post}
                            currentUser={currentUser}
                            isBookmarked
                            onBookmarkChange={handleBookmarkChange}
                            onHide={handleHide}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
