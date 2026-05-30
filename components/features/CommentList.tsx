'use client';

import {
    createComment,
    deleteComment,
    deleteReply,
    editComment,
    editReply,
    likeComment,
    replyToComment,
    unlikeComment,
} from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { IComment, IReply, IUser, Like } from '@/app/types/user';
import { LikeFilled, LikeOutlined, UserOutlined } from '@ant-design/icons';
import { App, Avatar, Button, Input, Typography } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import { Flag, MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReportModal from './ReportModal';
import { filterVisibleComments, getModerationNoticeMessage } from '@/app/utils/moderation';

const { Text } = Typography;
const { TextArea } = Input;

type DiscussionItem = IComment | IReply;

interface CommentProps {
    comment: DiscussionItem;
    onReply: (commentId: string, content: string) => Promise<void>;
    onEditComment: (commentId: string, content: string) => Promise<void>;
    onDeleteComment: (commentId: string) => Promise<void>;
    onEditReply: (commentId: string, replyIndex: number, content: string) => Promise<void>;
    onDeleteReply: (commentId: string, replyIndex: number) => Promise<void>;
    currentUser: IUser | null;
    parentCommentId?: string;
    replyIndex?: number;
}

function belongsToUser(like: Like, userId: string) {
    return (typeof like === 'string' ? like : like._id) === userId;
}

const CommentItem = ({
    comment,
    onReply,
    onEditComment,
    onDeleteComment,
    onEditReply,
    onDeleteReply,
    currentUser,
    parentCommentId,
    replyIndex,
}: CommentProps) => {
    const [showReply, setShowReply] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [likes, setLikes] = useState<Like[]>(comment.likes || []);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportActionsOpen, setReportActionsOpen] = useState(false);
    const reportMenuRef = useRef<HTMLDivElement>(null);
    const { message } = App.useApp();
    const isLiked = Boolean(currentUser && likes.some((like) => belongsToUser(like, currentUser._id)));
    const isReply = parentCommentId !== undefined && replyIndex !== undefined;
    const canManage = Boolean(currentUser && comment.user?._id === currentUser._id);
    const canReport = Boolean(currentUser && !canManage && !isReply);

    useEffect(() => {
        if (!reportActionsOpen) return;

        const closeMenu = (event: MouseEvent) => {
            if (!reportMenuRef.current?.contains(event.target as Node)) {
                setReportActionsOpen(false);
            }
        };

        document.addEventListener('mousedown', closeMenu);
        return () => document.removeEventListener('mousedown', closeMenu);
    }, [reportActionsOpen]);

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

    const handleSaveEdit = async () => {
        if (!editContent.trim()) return;
        if (parentCommentId !== undefined && replyIndex !== undefined) {
            await onEditReply(parentCommentId, replyIndex, editContent);
        } else {
            await onEditComment(comment._id, editContent);
        }
        setEditing(false);
    };

    const handleDelete = async () => {
        if (parentCommentId !== undefined && replyIndex !== undefined) {
            await onDeleteReply(parentCommentId, replyIndex);
        } else {
            await onDeleteComment(comment._id);
        }
    };

    return (
        <div className="mb-4" data-testid={isReply ? 'reply-item' : 'comment-item'}>
            <div className="flex gap-3">
                <Avatar src={comment.user?.profilePic || null} icon={<UserOutlined />} size="small" />
                <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex justify-between items-center gap-2 mb-1">
                        <Text strong className="text-sm">{comment.user?.name || 'Unknown'}</Text>
                        <div className="flex items-center gap-1">
                            <Text type="secondary" className="text-xs">
                                {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}
                            </Text>
                            {canReport && (
                                <div ref={reportMenuRef} className="relative">
                                    <button
                                        type="button"
                                        aria-label="More comment actions"
                                        aria-expanded={reportActionsOpen}
                                        onClick={() => setReportActionsOpen((open) => !open)}
                                        className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-slate-600"
                                    >
                                        <MoreHorizontal size={15} />
                                    </button>
                                    {reportActionsOpen && (
                                        <div className="absolute right-0 top-7 z-10 min-w-28 rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setReportActionsOpen(false);
                                                    setReportOpen(true);
                                                }}
                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                                            >
                                                <Flag size={14} /> Report
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {editing ? (
                        <div className="flex gap-2">
                            <Input
                                data-testid={isReply ? 'reply-edit-input' : 'comment-edit-input'}
                                value={editContent}
                                onChange={(event) => setEditContent(event.target.value)}
                            />
                            <Button
                                data-testid={isReply ? 'reply-edit-submit' : 'comment-edit-submit'}
                                type="primary"
                                size="small"
                                onClick={() => void handleSaveEdit()}
                            >
                                Save
                            </Button>
                        </div>
                    ) : (
                        <Text className="!text-slate-600">{comment.content}</Text>
                    )}
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
                        <Button data-testid="reply-toggle" type="text" size="small" onClick={() => setShowReply(!showReply)}>
                            Reply
                        </Button>
                        {canManage && (
                            <>
                                <Button
                                    data-testid={isReply ? 'reply-edit-toggle' : 'comment-edit-toggle'}
                                    type="text"
                                    size="small"
                                    onClick={() => setEditing(!editing)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    data-testid={isReply ? 'reply-delete' : 'comment-delete'}
                                    type="text"
                                    danger
                                    size="small"
                                    onClick={() => void handleDelete()}
                                >
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showReply && (
                <div className="ml-10 mt-2 flex gap-2">
                    <Input
                        data-testid="reply-input"
                        value={replyContent}
                        onChange={(event) => setReplyContent(event.target.value)}
                        placeholder="Write a reply..."
                        onPressEnter={() => void handleSubmitReply()}
                    />
                    <Button data-testid="reply-submit" type="primary" onClick={() => void handleSubmitReply()}>Reply</Button>
                </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-10 mt-2 border-l-2 pl-4 border-gray-100">
                    {comment.replies.map((reply, index) => (
                        <CommentItem
                            key={reply._id || `${reply.user?._id || 'reply'}-${index}`}
                            comment={reply}
                            onReply={onReply}
                            onEditComment={onEditComment}
                            onDeleteComment={onDeleteComment}
                            onEditReply={onEditReply}
                            onDeleteReply={onDeleteReply}
                            currentUser={currentUser}
                            parentCommentId={comment._id}
                            replyIndex={index}
                        />
                    ))}
                </div>
            )}
            {reportOpen && (
                <ReportModal
                    targetType="comment"
                    targetId={comment._id}
                    targetLabel={comment.content}
                    onClose={() => setReportOpen(false)}
                />
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
    const { message } = App.useApp();

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            const response = await createComment(postId, newComment);
            setNewComment('');
            await onCommentAdded();
            const moderationMessage = getModerationNoticeMessage(response);
            message[moderationMessage ? 'warning' : 'success'](moderationMessage || 'Comment added');
        } catch {
            message.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (commentId: string, content: string) => {
        try {
            const response = await replyToComment(commentId, content);
            await onCommentAdded();
            const moderationMessage = getModerationNoticeMessage(response);
            message[moderationMessage ? 'warning' : 'success'](moderationMessage || 'Reply added');
        } catch {
            message.error('Failed to reply');
        }
    };

    const handleEditComment = async (commentId: string, content: string) => {
        try {
            const response = await editComment(commentId, content);
            await onCommentAdded();
            const moderationMessage = getModerationNoticeMessage(response);
            message[moderationMessage ? 'warning' : 'success'](moderationMessage || 'Comment updated');
        } catch {
            message.error('Failed to edit comment');
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await deleteComment(commentId);
            await onCommentAdded();
            message.success('Comment deleted');
        } catch {
            message.error('Failed to delete comment');
        }
    };

    const handleEditReply = async (commentId: string, replyIndex: number, content: string) => {
        try {
            const response = await editReply(commentId, replyIndex, content);
            await onCommentAdded();
            const moderationMessage = getModerationNoticeMessage(response);
            message[moderationMessage ? 'warning' : 'success'](moderationMessage || 'Reply updated');
        } catch {
            message.error('Failed to edit reply');
        }
    };

    const handleDeleteReply = async (commentId: string, replyIndex: number) => {
        try {
            await deleteReply(commentId, replyIndex);
            await onCommentAdded();
            message.success('Reply deleted');
        } catch {
            message.error('Failed to delete reply');
        }
    };

    return (
        <section className="surface mt-6 p-5 sm:p-6">
            <Typography.Title level={4} className="!mb-5 !text-slate-900">Conversation</Typography.Title>
            {currentUser ? (
                <div className="mb-7 flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <Avatar src={currentUser.profilePic || null} icon={<UserOutlined />} />
                    <div className="flex-1">
                        <TextArea
                            data-testid="comment-input"
                            rows={2}
                            value={newComment}
                            onChange={(event) => setNewComment(event.target.value)}
                            placeholder="Write a comment..."
                            className="soft-input mb-3"
                        />
                        <Button data-testid="comment-submit" type="primary" onClick={() => void handleAddComment()} loading={submitting}>
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
                {filterVisibleComments(comments).map((comment, index) => (
                    <CommentItem
                        key={comment._id || `${comment.user?._id || 'comment'}-${index}`}
                        comment={comment}
                        onReply={handleReply}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onEditReply={handleEditReply}
                        onDeleteReply={handleDeleteReply}
                        currentUser={currentUser}
                    />
                ))}
            </div>
        </section>
    );
};

export default CommentList;
