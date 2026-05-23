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
import { Globe2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { likePost, unlikePost } from '@/app/api/api';
import { IPost, IUser, Like } from '@/app/types/user';

interface PostCardProps {
    post: IPost;
    onDelete?: (id: string) => void;
    currentUser: IUser | null;
}

function belongsToUser(like: Like, userId: string) {
    return (typeof like === 'string' ? like : like._id) === userId;
}

const PostCard = ({ post, onDelete, currentUser }: PostCardProps) => {
    const [likes, setLikes] = useState<Like[]>(post.likes || []);
    const isLiked = Boolean(currentUser && likes.some((like) => belongsToUser(like, currentUser._id)));

    const handleLike = async () => {
        if (!currentUser) return;

        try {
            const response = await (isLiked ? unlikePost(post._id) : likePost(post._id));
            setLikes(response.likes || []);
        } catch {
            // Keep the server-confirmed count displayed when engagement fails.
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
                <p className="mt-2 whitespace-pre-line text-[0.96rem] leading-7 text-slate-600">{post.content}</p>
                {post.image && (
                    <div className="mt-5 overflow-hidden rounded-2xl bg-slate-100">
                        <Image
                            src={post.image}
                            alt={post.title || 'Post content'}
                            width={900}
                            height={540}
                            unoptimized={post.image.startsWith('data:')}
                            className="max-h-[29rem] w-full object-cover transition duration-300 hover:scale-[1.01]"
                        />
                    </div>
                )}
            </Link>

            <footer className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                    <Button
                        type="text"
                        icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
                        onClick={handleLike}
                        className={`!flex !items-center !rounded-xl !px-3 ${isLiked ? '!bg-indigo-50 !text-indigo-600' : '!text-slate-500'}`}
                    >
                        {likes.length}
                    </Button>
                    <Link href={`/posts/${post._id}`}>
                        <Button type="text" icon={<CommentOutlined />} className="!rounded-xl !px-3 !text-slate-500">
                            {post.comments?.length || 0}
                        </Button>
                    </Link>
                </div>
                {currentUser && post.author?._id === currentUser._id && (
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onDelete?.(post._id)}
                        className="!rounded-xl"
                    >
                        Remove
                    </Button>
                )}
            </footer>
        </article>
    );
};

export default PostCard;
