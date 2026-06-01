'use client';

import { Avatar, Button } from 'antd';
import {
    CommentOutlined,
    DeleteOutlined,
    LikeFilled,
    LikeOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { Archive, EyeOff, Flag, Globe2, MoreHorizontal, Share2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { archivePost, hidePost, likePost, unlikePost } from '@/app/api/api';
import { IPost, IUser } from '@/app/types/user';
import BookmarkButton from './BookmarkButton';
import ReportModal from './ReportModal';
import ShareModal from './ShareModal';
import RichText from './RichText';

interface PostCardProps {
    post: IPost;
    onDelete?: (id: string) => void;
    currentUser: IUser | null;
    isBookmarked?: boolean;
    onBookmarkChange?: (postId: string, bookmarked: boolean) => void;
    onHide?: (postId: string) => void;
    onArchive?: (postId: string) => void;
}

const PostCard = ({ post, onDelete, currentUser, isBookmarked, onBookmarkChange, onHide, onArchive }: PostCardProps) => {
    const [likesCount, setLikesCount] = useState(post.likesCount ?? post.likes?.length ?? 0);
    const [likedByMe, setLikedByMe] = useState(Boolean(post.isLikedByMe));
    const [actionsOpen, setActionsOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const actionMenuRef = useRef<HTMLDivElement>(null);
    const isLiked = Boolean(currentUser && likedByMe);
    const postImage = post.image || '/default_image.png';

    useEffect(() => {
        if (!actionsOpen) return;

        const closeActionsOnOutsideClick = (event: MouseEvent) => {
            if (!actionMenuRef.current?.contains(event.target as Node)) {
                setActionsOpen(false);
            }
        };

        document.addEventListener('mousedown', closeActionsOnOutsideClick);
        return () => document.removeEventListener('mousedown', closeActionsOnOutsideClick);
    }, [actionsOpen]);

    const handleLike = async () => {
        if (!currentUser) return;

        try {
            const nextLiked = !isLiked;
            setLikedByMe(nextLiked);
            setLikesCount((currentCount) => Math.max(0, currentCount + (nextLiked ? 1 : -1)));
            const response = await (isLiked ? unlikePost(post._id) : likePost(post._id));
            setLikedByMe(response.isLikedByMe);
            setLikesCount(response.likesCount);
        } catch {
            // Keep the server-confirmed count displayed when engagement fails.
        }
    };

    const handleHide = async () => {
        setActionsOpen(false);
        try {
            await hidePost(post._id);
            onHide?.(post._id);
        } catch {
            // Leave the post visible if the server did not confirm the hide.
        }
    };

    const handleArchive = async () => {
        setActionsOpen(false);
        try {
            await archivePost(post._id);
            onArchive?.(post._id);
        } catch {
            // Leave the post visible if archiving did not complete.
        }
    };

    return (
        <article className="surface overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-26px_rgba(15,23,42,0.28)] sm:p-6">
            <header className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Avatar
                        size={44}
                        src={post.author?.profilePic}
                        icon={<UserOutlined />}
                        className="bg-indigo-100 text-indigo-600"
                    />
                    <div>
                        <p className="font-semibold text-slate-900">{post.author?.name || 'Unknown User'}</p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                            <span>{post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ''}</span>
                            <span>·</span>
                            <Globe2 size={12} />
                        </div>
                    </div>
                </div>
                {post.category && <span className="tag-pill">{post.category}</span>}
            </header>

            <Link href={`/posts/${post._id}`} className="block">
                {post.title && <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">{post.title}</h3>}
                <p className="mt-2 whitespace-pre-line text-[0.96rem] leading-7 text-slate-600"><RichText text={post.content} /></p>
                <div className="mt-5 overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                        src={postImage}
                        alt={post.title || 'Post content'}
                        width={900}
                        height={540}
                        unoptimized={postImage.startsWith('data:')}
                        className="max-h-[29rem] w-full object-cover transition duration-300 hover:scale-[1.01]"
                    />
                </div>
            </Link>

            <footer className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                    <Button
                        type="text"
                        icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
                        onClick={handleLike}
                        className={`!flex !items-center !rounded-xl !px-3 ${isLiked ? '!bg-indigo-50 !text-indigo-600' : '!text-slate-500'}`}
                    >
                        {likesCount}
                    </Button>
                    <Link href={`/posts/${post._id}`}>
                        <Button type="text" icon={<CommentOutlined />} className="!rounded-xl !px-3 !text-slate-500">
                            {post.commentsCount ?? post.comments?.length ?? 0}
                        </Button>
                    </Link>
                    <BookmarkButton
                        postId={post._id}
                        currentUser={currentUser}
                        initialBookmarked={isBookmarked ?? post.isSavedByMe ?? post.isBookmarked}
                        onBookmarkChange={onBookmarkChange}
                    />
                </div>
                <div ref={actionMenuRef} className="relative flex items-center gap-2">
                {currentUser && (
                    <>
                        <Button
                            type="text"
                            aria-label="More post actions"
                            aria-expanded={actionsOpen}
                            icon={<MoreHorizontal size={18} />}
                            onClick={() => setActionsOpen((open) => !open)}
                            className="!rounded-xl !text-slate-500"
                        />
                        {actionsOpen && (
                            <div className="absolute bottom-11 right-0 z-10 min-w-32 rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg">
                                {post.author?._id === currentUser._id ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActionsOpen(false);
                                                setShareOpen(true);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <Share2 size={15} /> Share
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void handleArchive()}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <Archive size={15} /> Archive
                                        </button>
                                        {onDelete && (
                                            <button
                                                type="button"
                                                onClick={() => onDelete(post._id)}
                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                                            >
                                                <DeleteOutlined /> Remove
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActionsOpen(false);
                                                setShareOpen(true);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <Share2 size={15} /> Share
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void handleHide()}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <EyeOff size={15} /> Hide post
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActionsOpen(false);
                                                setReportOpen(true);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                                        >
                                            <Flag size={15} /> Report
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
                </div>
            </footer>
            {shareOpen && (
                <ShareModal
                    targetType="post"
                    targetId={post._id}
                    targetLabel={post.title}
                    currentUserId={currentUser?._id}
                    onClose={() => setShareOpen(false)}
                />
            )}
            {reportOpen && (
                <ReportModal
                    targetType="post"
                    targetId={post._id}
                    targetLabel={post.title}
                    onClose={() => setReportOpen(false)}
                />
            )}
        </article>
    );
};

export default PostCard;
