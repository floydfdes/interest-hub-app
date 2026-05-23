'use client';

import { Avatar, Button, Input, message, Typography } from 'antd';
import { UserOutlined, LikeOutlined, LikeFilled } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

const { Text } = Typography;
const { TextArea } = Input;

interface CommentProps {
    comment: any;
    onReply: (commentId: string, content: string) => void;
    currentUser: any;
}

const CommentItem = ({ comment, onReply, currentUser }: CommentProps) => {
    const [showReply, setShowReply] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [likes, setLikes] = useState(comment.likes || []);
    const isLiked = currentUser && likes.some((like: any) =>
        (typeof like === 'string' ? like : like._id) === currentUser._id
    );

    const handleLike = async () => {
        if (!currentUser) return;
        try {
            const endpoint = isLiked ? 'unlike' : 'like';
            const res = await api.post(`/comments/${comment._id}/${endpoint}`);
            setLikes(res.data.likes || []);
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    };

    const handleSubmitReply = () => {
        if (!replyContent.trim()) return;
        onReply(comment._id, replyContent);
        setReplyContent('');
        setShowReply(false);
    };

    return (
        <div className="mb-4">
            <div className="flex gap-3">
                <Avatar src={comment.user?.profilePic} icon={<UserOutlined />} size="small" />
                <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                        <Text strong className="text-sm">{comment.user?.name || 'Unknown'}</Text>
                        <Text type="secondary" className="text-xs">
                            {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}
                        </Text>
                    </div>
                    <Text>{comment.content}</Text>
                    <div className="flex gap-4 mt-2">
                        <Button
                            type="text"
                            size="small"
                            icon={isLiked ? <LikeFilled className="text-blue-500" /> : <LikeOutlined />}
                            onClick={handleLike}
                            className={isLiked ? 'text-blue-500' : ''}
                        >
                            {likes.length}
                        </Button>
                        <Button type="text" size="small" onClick={() => setShowReply(!showReply)}>
                            Reply
                        </Button>
                    </div>
                </div>
            </div>

            {showReply && (
                <div className="ml-10 mt-2">
                    <Input.Group compact>
                        <Input
                            style={{ width: 'calc(100% - 80px)' }}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            onPressEnter={handleSubmitReply}
                        />
                        <Button type="primary" onClick={handleSubmitReply}>Reply</Button>
                    </Input.Group>
                </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-10 mt-2 border-l-2 pl-4 border-gray-100">
                    {comment.replies.map((reply: any) => (
                        <CommentItem
                            key={reply._id}
                            comment={reply}
                            onReply={onReply}
                            currentUser={currentUser}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface CommentListProps {
    comments: any[];
    postId: string;
    onCommentAdded: () => void;
}

const CommentList = ({ comments, postId, onCommentAdded }: CommentListProps) => {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            await api.post('/comments', { postId, content: newComment });
            setNewComment('');
            onCommentAdded();
            message.success('Comment added');
        } catch (error) {
            message.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (commentId: string, content: string) => {
        try {
            await api.post(`/comments/${commentId}/reply`, { content });
            onCommentAdded();
            message.success('Reply added');
        } catch (error) {
            message.error('Failed to reply');
        }
    };

    return (
        <div className="mt-6">
            <Typography.Title level={5}>Comments</Typography.Title>

            {currentUser ? (
                <div className="mb-6 flex gap-3">
                    <Avatar src={currentUser.profilePic} icon={<UserOutlined />} />
                    <div className="flex-1">
                        <TextArea
                            rows={2}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="mb-2"
                        />
                        <Button type="primary" onClick={handleAddComment} loading={submitting}>
                            Comment
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="mb-6 p-4 bg-gray-50 rounded text-center">
                    <Text>Please login to comment</Text>
                </div>
            )}

            <div className="space-y-4">
                {comments.map((comment) => (
                    <CommentItem
                        key={comment._id}
                        comment={comment}
                        onReply={handleReply}
                        currentUser={currentUser}
                    />
                ))}
            </div>
        </div>
    );
};

export default CommentList;
