'use client';

import { Card, Avatar, Button, Typography } from 'antd';
import { LikeOutlined, LikeFilled, CommentOutlined, DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useState } from 'react';
import api from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

const { Text, Paragraph } = Typography;

interface PostCardProps {
    post: any;
    onDelete?: (id: string) => void;
    currentUser: any;
}

const PostCard = ({ post, onDelete, currentUser }: PostCardProps) => {
    const [likes, setLikes] = useState(post.likes || []);
    const isLiked = currentUser && likes.some((like: any) =>
        (typeof like === 'string' ? like : like._id) === currentUser._id
    );

    const handleLike = async () => {
        if (!currentUser) return;
        try {
            const endpoint = isLiked ? 'unlike' : 'like';
            const res = await api.post(`/posts/${post._id}/${endpoint}`);
            setLikes(res.data.likes || []);
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleDelete = () => {
        if (onDelete) onDelete(post._id);
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
                            <img
                                src={post.image}
                                alt="Post content"
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
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={handleDelete}>
                        Delete
                    </Button>
                )}
            </div>
        </Card>
    );
};

import { UserOutlined } from '@ant-design/icons';

export default PostCard;
