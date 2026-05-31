'use client';

import {
    bulkDeleteAdminComments,
    deleteAdminComment,
    deleteAdminPost,
    deleteAdminReply,
    getAdminPost,
    getErrorMessage,
} from '@/app/api/api';
import { IPost } from '@/app/types/user';
import { App, Empty, Skeleton } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, MessageCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

export default function AdminPostDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [post, setPost] = useState<IPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCommentIds, setSelectedCommentIds] = useState<Set<string>>(new Set());
    const { message } = App.useApp();

    const refreshPost = async () => {
        try {
            setPost(await getAdminPost(id));
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to refresh post.'));
        }
    };

    useEffect(() => {
        let cancelled = false;
        const loadPost = async () => {
            try {
                const response = await getAdminPost(id);
                if (!cancelled) setPost(response);
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load post.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void loadPost();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const confirmDeletion = async (title: string, text: string) => {
        const result = await Swal.fire({
            title,
            text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete permanently',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#e11d48',
        });
        return result.isConfirmed;
    };

    const handleDeletePost = async () => {
        if (!post || !await confirmDeletion('Permanently delete post?', 'This post and all of its comments will be permanently deleted.')) return;
        try {
            await deleteAdminPost(post._id);
            message.success('Post permanently deleted');
            router.push('/admin/posts');
        } catch (err: unknown) {
            message.error(getErrorMessage(err, 'Failed to delete post.'));
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!await confirmDeletion('Permanently delete comment?', 'This comment and all of its replies will be permanently deleted.')) return;
        try {
            await deleteAdminComment(commentId);
            message.success('Comment permanently deleted');
            setSelectedCommentIds((current) => {
                const next = new Set(current);
                next.delete(commentId);
                return next;
            });
            await refreshPost();
        } catch (err: unknown) {
            message.error(getErrorMessage(err, 'Failed to delete comment.'));
        }
    };

    const handleDeleteReply = async (commentId: string, replyIndex: number) => {
        if (!await confirmDeletion('Permanently delete reply?', 'This reply will be permanently deleted.')) return;
        try {
            await deleteAdminReply(commentId, replyIndex);
            message.success('Reply permanently deleted');
            await refreshPost();
        } catch (err: unknown) {
            message.error(getErrorMessage(err, 'Failed to delete reply.'));
        }
    };

    const handleBulkDeleteComments = async () => {
        const ids = Array.from(selectedCommentIds);
        if (ids.length === 0) return;
        if (!await confirmDeletion('Permanently delete selected comments?', 'This permanently deletes the selected comments and their replies. This cannot be undone.')) return;

        try {
            const deleted = await bulkDeleteAdminComments(ids);
            message.success(`${deleted.deleted} ${deleted.deleted === 1 ? 'comment' : 'comments'} deleted permanently.`);
            if (deleted.requested > deleted.deleted) {
                message.info('Some selected comments no longer existed.');
            }
            setSelectedCommentIds(new Set());
            await refreshPost();
        } catch (err: unknown) {
            message.error(getErrorMessage(err, 'Failed to delete selected comments.'));
        }
    };

    const toggleCommentSelection = (commentId: string, checked: boolean) => {
        setSelectedCommentIds((current) => {
            if (checked && !current.has(commentId) && current.size >= 100) {
                message.warning('Select up to 100 comments at a time.');
                return current;
            }
            const next = new Set(current);
            if (checked) next.add(commentId);
            else next.delete(commentId);
            return next;
        });
    };

    if (loading) return <div className="surface p-7"><Skeleton active paragraph={{ rows: 8 }} /></div>;
    if (error || !post) return <div className="surface p-8 text-center text-rose-600">{error || 'Post not found.'}</div>;

    return (
        <div>
            <div className="mb-6 flex items-center justify-between gap-3">
                <Link href="/admin/posts" className="secondary-button"><ArrowLeft size={15} /> Back to posts</Link>
                <button type="button" onClick={() => void handleDeletePost()} className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700">
                    <Trash2 size={15} className="mr-2 inline" /> Delete post
                </button>
            </div>

            <article className="surface overflow-hidden p-6 sm:p-7">
                {post.image && <Image src={post.image} alt={post.title} width={900} height={450} unoptimized={post.image.startsWith('data:')} className="mb-6 max-h-[26rem] w-full rounded-2xl object-cover" />}
                <div className="flex flex-wrap items-center gap-3">
                    <span className="tag-pill">{post.visibility}</span>
                    <span className="text-sm text-slate-500">{post.category}</span>
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{post.title}</h1>
                <p className="mt-4 whitespace-pre-line text-base leading-7 text-slate-600">{post.content}</p>
                <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-100 pt-5 text-sm text-slate-500">
                    <span>By {post.author?.name || 'Unknown author'}</span>
                    <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                    <span>{post.likesCount ?? post.likes?.length ?? 0} likes</span>
                </div>
            </article>

            <section className="mt-7">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-900"><MessageCircle size={21} /> Comments</h2>
                    {selectedCommentIds.size > 0 && (
                        <button type="button" onClick={() => void handleBulkDeleteComments()} className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700">
                            <Trash2 size={15} className="mr-2 inline" /> Delete selected comments
                        </button>
                    )}
                </div>
                {post.comments?.length === 0 ? (
                    <div className="surface p-10"><Empty description="No comments on this post" /></div>
                ) : (
                    <div className="space-y-4">
                        {(post.comments || []).map((comment) => (
                            <div key={comment._id} className="surface p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            aria-label={`Select comment by ${comment.user?.name || 'Unknown user'}`}
                                            checked={selectedCommentIds.has(comment._id)}
                                            onChange={(event) => toggleCommentSelection(comment._id, event.target.checked)}
                                            className="mt-1"
                                        />
                                        <div>
                                            <p className="font-semibold text-slate-900">{comment.user?.name || 'Unknown user'}</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">{comment.content}</p>
                                        </div>
                                    </div>
                                    <button type="button" aria-label="Delete comment" onClick={() => void handleDeleteComment(comment._id)} className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"><Trash2 size={16} /></button>
                                </div>
                                {comment.replies?.length > 0 && (
                                    <div className="mt-4 space-y-3 border-l-2 border-indigo-100 pl-4">
                                        {comment.replies.map((reply, index) => (
                                            <div key={reply._id || index} className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 p-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{reply.user?.name || 'Unknown user'}</p>
                                                    <p className="mt-1 text-sm text-slate-600">{reply.content}</p>
                                                </div>
                                                <button type="button" aria-label="Delete reply" onClick={() => void handleDeleteReply(comment._id, index)} className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"><Trash2 size={15} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
