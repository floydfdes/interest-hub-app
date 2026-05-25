'use client';

import { deletePost, getAllPosts, getBookmarkedPosts } from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { IPost, Pagination } from '@/app/types/user';
import { App, Empty, Skeleton } from 'antd';
import { useEffect, useState } from 'react';
import PostCard from './PostCard';

const PostList = () => {
    const [posts, setPosts] = useState<IPost[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const currentUser = useCurrentUser();
    const { message } = App.useApp();

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const hasToken = Boolean(localStorage.getItem('token'));
                const [response, bookmarks] = await Promise.all([
                    getAllPosts(),
                    hasToken ? getBookmarkedPosts().catch(() => []) : Promise.resolve([]),
                ]);
                const nextBookmarkedIds = new Set(bookmarks.map((post) => post._id));
                setPosts(response.items.map((post) => ({
                    ...post,
                    isBookmarked: nextBookmarkedIds.has(post._id) || post.isBookmarked,
                })));
                setBookmarkedIds(nextBookmarkedIds);
                setPagination(response.pagination);
            } catch {
                message.error('Failed to load posts');
            } finally {
                setLoading(false);
            }
        };

        void fetchPosts();
    }, [message]);

    const loadMore = async () => {
        if (!pagination?.hasNextPage) return;

        setLoadingMore(true);
        try {
            const response = await getAllPosts(pagination.page + 1, pagination.limit);
            setPosts((currentPosts) => [...currentPosts, ...response.items.map((post) => ({
                ...post,
                isBookmarked: bookmarkedIds.has(post._id) || post.isBookmarked,
            }))]);
            setPagination(response.pagination);
        } catch {
            message.error('Failed to load more posts');
        } finally {
            setLoadingMore(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deletePost(id);
            setPosts((currentPosts) => currentPosts.filter((post) => post._id !== id));
            message.success('Post deleted');
        } catch {
            message.error('Failed to delete post');
        }
    };

    const handleBookmarkChange = (postId: string, bookmarked: boolean) => {
        setBookmarkedIds((currentIds) => {
            const nextIds = new Set(currentIds);
            if (bookmarked) nextIds.add(postId);
            else nextIds.delete(postId);
            return nextIds;
        });
        setPosts((currentPosts) => currentPosts.map((post) => (
            post._id === postId ? { ...post, isBookmarked: bookmarked } : post
        )));
    };

    if (loading) {
        return (
            <div className="surface p-6">
                <Skeleton active avatar paragraph={{ rows: 4 }} />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="surface px-6 py-14">
                <Empty description={<span className="text-slate-500">No posts yet. Be the first to share an interest.</span>} />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {posts.map((post) => (
                <PostCard
                    key={post._id}
                    post={post}
                    onDelete={handleDelete}
                    currentUser={currentUser}
                    isBookmarked={post.isBookmarked}
                    onBookmarkChange={handleBookmarkChange}
                />
            ))}
            {pagination?.hasNextPage && (
                <button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="secondary-button mx-auto">
                    {loadingMore ? 'Loading...' : 'Load more'}
                </button>
            )}
        </div>
    );
};

export default PostList;
