'use client';

import { Avatar, Button, Card, Typography } from 'antd';
import {
    CommentOutlined,
    DeleteOutlined,
    LikeFilled,
    LikeOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { likePost, unlikePost } from '@/app/api/api';
import { IPost, IUser, Like } from '@/app/types/user';

const { Text, Paragraph } = Typography;

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
            // A failed engagement should leave the currently displayed server state untouched.
        }
    };

    return (
        <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
            <Card.Meta
                avatar={<Avatar src={post.author?.profilePic} icon={<UserOutlined />} />}
                title={
                    <div className="flex justify-between items-center">
                        <Text strong>{post.author?.name || 'Unknown User'}</Text>
                        <Text type="secondary" className="text-xs">
                            {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ''}
                        </Text>
                    </div>
                }
                description={
                    <div>
                        <Paragraph className="mt-2 text-gray-800 text-base">
                            {post.content}
                        </Paragraph>
                        {post.image && (
                            <Image
                                src={post.image}
                                alt={post.title || 'Post content'}
                                width={800}
                                height={500}
                                unoptimized={post.image.startsWith('data:')}
                                className="w-full h-auto rounded-lg mt-2 max-h-96 object-cover"
                            />
                        )}
                    </div>
                }
            />
            <div className="mt-4 flex items-center gap-6 border-t pt-3">
                <Button
                    type="text"
                    icon={isLiked ? <LikeFilled className="text-blue-500" /> : <LikeOutlined />}
                    onClick={handleLike}
                    className={isLiked ? 'text-blue-500' : ''}
                >
                    {likes.length} Likes
                </Button>
                <Link href={`/posts/${post._id}`}>
                    <Button type="text" icon={<CommentOutlined />}>
                        {post.comments?.length || 0} Comments
                    </Button>
                </Link>
                {currentUser && post.author?._id === currentUser._id && (
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete?.(post._id)}>
                        Delete
                    </Button>
                )}
            </div>
        </Card>
    );
};

export default PostCard;
