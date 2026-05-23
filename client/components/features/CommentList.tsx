'use client';

import { Avatar, Button, Input, message, Typography } from 'antd';
import { LikeFilled, LikeOutlined, UserOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import {
    createComment,
    likeComment,
    replyToComment,
    unlikeComment,
} from '@/app/api/api';
import { IComment, IReply, IUser, Like } from '@/app/types/user';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

const { Text } = Typography;
const { TextArea } = Input;

type DiscussionItem = IComment | IReply;

interface CommentProps {
    comment: DiscussionItem;
    onReply: (commentId: string, content: string) => Promise<void>;
    currentUser: IUser | null;
}

function belongsToUser(like: Like, userId: string) {
    return (typeof like === 'string' ? like : like._id) === userId;
}

const CommentItem = ({ comment, onReply, currentUser }: CommentProps) => {
    const [showReply, setShowReply] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [likes, setLikes] = useState<Like[]>(comment.likes || []);
    const isLiked = Boolean(currentUser && likes.some((like) => belongsToUser(like, currentUser._id)));

    const handleLike = async () => {
        if (!currentUser) return;

        try {
            const response = await (isLiked ? unlikeComment(comment._id) : likeComment(comment._id));
            setLikes(response.likes || []);
        } catch {
            message.error('Failed to update like');
        }
    };

    const handleSubmitReply = async () => {
        if (!replyContent.trim()) return;
        await onReply(comment._id, replyContent);
        setReplyContent('');
        setShowReply(false);
    };

    return (
        <div className="mb-4">
            <div className="flex gap-3">
                <Avatar src={comment.user?.profilePic} icon={<UserOutlined />} size="small" />
                <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex justify-between items-center mb-1">
                        <Text strong className="text-sm">{comment.user?.name || 'Unknown'}</Text>
                        <Text type="secondary" className="text-xs">
                            {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}
                        </Text>
                    </div>
                        <Text className="!text-slate-600">{comment.content}</Text>
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
                <div className="ml-10 mt-2 flex gap-2">
                    <Input
                        value={replyContent}
                        onChange={(event) => setReplyContent(event.target.value)}
                        placeholder="Write a reply..."
                        onPressEnter={() => void handleSubmitReply()}
                    />
                    <Button type="primary" onClick={() => void handleSubmitReply()}>Reply</Button>
                </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-10 mt-2 border-l-2 pl-4 border-gray-100">
                    {comment.replies.map((reply) => (
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
    comments: IComment[];
    postId: string;
    onCommentAdded: () => Promise<void>;
}

const CommentList = ({ comments, postId, onCommentAdded }: CommentListProps) => {
    const currentUser = useCurrentUser();
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            await createComment(postId, newComment);
            setNewComment('');
            await onCommentAdded();
            message.success('Comment added');
        } catch {
            message.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (commentId: string, content: string) => {
        try {
            await replyToComment(commentId, content);
            await onCommentAdded();
            message.success('Reply added');
        } catch {
            message.error('Failed to reply');
        }
    };

    return (
        <section className="surface mt-6 p-5 sm:p-6">
            <Typography.Title level={4} className="!mb-5 !text-slate-900">Conversation</Typography.Title>
            {currentUser ? (
                <div className="mb-7 flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <Avatar src={currentUser.profilePic} icon={<UserOutlined />} />
                    <div className="flex-1">
                        <TextArea
                            rows={2}
                            value={newComment}
                            onChange={(event) => setNewComment(event.target.value)}
                            placeholder="Write a comment..."
                            className="soft-input mb-3"
                        />
                        <Button type="primary" onClick={() => void handleAddComment()} loading={submitting}>
                            Comment
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="mb-6 rounded-2xl bg-slate-50 p-5 text-center">
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
        </section>
    );
};

export default CommentList;
