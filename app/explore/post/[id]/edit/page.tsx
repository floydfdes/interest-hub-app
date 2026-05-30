"use client";

import { createComment, deleteComment, deleteReply, editComment, editReply, getErrorMessage, getPostById, likeComment, likeReply, replyToComment, unlikeComment, updatePost } from "@/app/api/api";
import { compressAndConvertToBase64, resizeImageToBase64 } from "@/app/api/imageUtil";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { IComment, IPost, PostInput } from "@/app/types/user";
import { Edit, ThumbsUp, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import Image from "next/image";

const categories = ["Tech", "Health", "Travel", "Design", "Education"];
const visibilities = [
    { value: "public", label: "Public" },
    { value: "followersOnly", label: "Followers only" },
    { value: "private", label: "Only me" },
] as const;
type EditablePost = Omit<PostInput, "tags"> & { tags: string };

export default function EditPostPage() {
    const router = useRouter();
    const params = useParams();
    const postId = params?.id as string;
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [form, setForm] = useState<EditablePost>({
        title: "",
        content: "",
        category: "",
        tags: "",
        image: "",
        visibility: "public",
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const [comments, setComments] = useState<IComment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [commentError, setCommentError] = useState("");
    const currentUser = useCurrentUser();
    const currentUserId = currentUser?._id || "";

    const fetchPost = async () => {
        try {
            const data = await getPostById(postId) as IPost;
            setForm({
                title: data.title,
                content: data.content,
                category: data.category,
                tags: data.tags.join(", "),
                image: data.image,
                visibility: data.visibility,
            });
            setImagePreview(data.image || null);
            setComments(data.comments);
        } catch {
            setError("Failed to fetch post");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!postId) return;
        let cancelled = false;

        const loadPost = async () => {
            try {
                const data = await getPostById(postId) as IPost;
                if (cancelled) return;
                setForm({
                    title: data.title,
                    content: data.content,
                    category: data.category,
                    tags: data.tags.join(", "),
                    image: data.image,
                    visibility: data.visibility,
                });
                setImagePreview(data.image || null);
                setComments(data.comments);
            } catch {
                if (!cancelled) setError("Failed to fetch post");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadPost();
        return () => {
            cancelled = true;
        };
    }, [postId]);

    const handleChange = (field: keyof EditablePost, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = async (file: File) => {
        const base64 = await resizeImageToBase64(file, 400, 250);
        if (base64) {
            setImagePreview(base64);
            handleChange("image", base64);
        }
    };

    const handleImageURL = async (url: string) => {
        try {
            const base64 = await compressAndConvertToBase64(url);
            if (base64) {
                setImagePreview(base64);
                handleChange("image", base64);
            }
        } catch {
            setError("Invalid image URL");
        }
    };

    const handleSubmit = async () => {
        try {
            setError("");
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Unauthorized");

            const payload = {
                title: form.title,
                content: form.content,
                category: form.category,
                visibility: form.visibility,
                ...(form.image.startsWith("data:") && { image: form.image }),
                tags: form.tags.split(",").map((t) => t.trim()),
            };

            await updatePost(postId, payload);
            router.push("/explore");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Update failed"));
        }
    };

    const handleAddComment = async () => {
        try {
            setCommentError("");
            if (!newComment.trim()) {
                setCommentError("Comment cannot be empty");
                return;
            }

            const token = localStorage.getItem("token");
            if (!token) throw new Error("Unauthorized");

            await createComment(postId, newComment);
            await fetchPost();
            setNewComment("");
        } catch (err: unknown) {
            setCommentError(getErrorMessage(err, "Failed to add comment"));
        }
    };

    const handleEditComment = async (commentId: string, updatedContent: string) => {
        try {
            await editComment(commentId, updatedContent);
            await fetchPost();
        } catch (err: unknown) {
            setCommentError(getErrorMessage(err, "Failed to edit comment"));
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await deleteComment(commentId);
            await fetchPost();
        } catch (err: unknown) {
            setCommentError(getErrorMessage(err, "Failed to delete comment"));
        }
    };

    const handleLikeComment = async (commentId: string) => {
        try {
            await likeComment(commentId);
            await fetchPost();
        } catch (err: unknown) {
            setCommentError(getErrorMessage(err, "Failed to like comment"));
        }
    };

    const handleUnlikeComment = async (commentId: string) => {
        try {
            await unlikeComment(commentId);
            await fetchPost();
        } catch (err: unknown) {
            setCommentError(getErrorMessage(err, "Failed to unlike comment"));
        }
    };

    const handleReplyToComment = async (commentId: string, replyContent: string) => {
        try {
            await replyToComment(commentId, replyContent);
            await fetchPost();
        } catch (err: unknown) {
            setCommentError(getErrorMessage(err, "Failed to reply to comment"));
        }
    };

    const handleEditReply = async (commentId: string, replyIndex: number, updatedContent: string) => {
        try {
            await editReply(commentId, replyIndex, updatedContent);
            await fetchPost();
        } catch (err: unknown) {
            setCommentError(getErrorMessage(err, "Failed to edit reply"));
        }
    };

    const handleDeleteReply = async (commentId: string, replyIndex: number) => {
        try {
            await deleteReply(commentId, replyIndex);
            await fetchPost();
        } catch (err: unknown) {
            setCommentError(getErrorMessage(err, "Failed to delete reply"));
        }
    };

    const handleLikeReply = async (commentId: string, replyIndex: number) => {
        try {
            await likeReply(commentId, replyIndex);
            await fetchPost();
        } catch (err: unknown) {
            setCommentError(getErrorMessage(err, "Failed to like reply"));
        }
    };

    if (loading) return <div className="surface shell-container max-w-2xl p-12 text-center text-slate-500">Loading post...</div>;

    return (
        <div className="shell-container flex justify-center">
            <div className="surface w-full max-w-3xl p-6 sm:p-8">
                <span className="eyebrow">Edit</span>
                <h1 className="mb-7 mt-4 text-3xl font-bold tracking-tight text-slate-900">Update post</h1>

                {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                <input
                    data-testid="edit-post-title"
                    type="text"
                    placeholder="Post Title"
                    className="soft-input mb-4 w-full px-4 outline-none"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                />

                <textarea
                    data-testid="edit-post-content"
                    placeholder="Content"
                    className="soft-input mb-4 min-h-[120px] w-full p-4 outline-none"
                    value={form.content}
                    onChange={(e) => handleChange("content", e.target.value)}
                />

                <select
                    data-testid="edit-post-category"
                    className="soft-input mb-4 w-full px-4 outline-none"
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                        <option key={cat}>{cat}</option>
                    ))}
                </select>

                <input
                    data-testid="edit-post-tags"
                    type="text"
                    placeholder="Tags (comma-separated)"
                    className="soft-input mb-4 w-full px-4 outline-none"
                    value={form.tags}
                    onChange={(e) => handleChange("tags", e.target.value)}
                />

                <div className="mb-4">
                    <p className="mb-2 text-sm font-medium text-slate-700">Update image</p>
                    <div className="flex gap-4 flex-col sm:flex-row">
                        <input
                            data-testid="edit-post-image-url"
                            type="text"
                            placeholder="Paste Image URL"
                            className="soft-input w-full px-4 outline-none"
                            onBlur={(e) => handleImageURL(e.target.value)}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file);
                            }}
                        />
                        <button
                            data-testid="edit-post-image-upload"
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="secondary-button"
                        >
                            Upload
                        </button>
                    </div>
                </div>

                {imagePreview && (
                    <div className="relative mb-6 h-56 w-full overflow-hidden rounded-2xl bg-slate-100">
                        <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 600px"
                        />
                    </div>
                )}

                <select
                    data-testid="edit-post-visibility"
                    className="soft-input mb-6 w-full px-4 outline-none"
                    value={form.visibility}
                    onChange={(e) => handleChange("visibility", e.target.value)}
                >
                    {visibilities.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <button
                    data-testid="edit-post-submit"
                    onClick={handleSubmit}
                    className="primary-button mb-8 w-full"
                >
                    Update Post
                </button>

                <div className="mt-8">
                    <h2 className="mb-5 text-2xl font-bold tracking-tight text-slate-900">Comments</h2>

                    <div className="flex items-start gap-4 mb-6">
                        <textarea
                            data-testid="edit-comment-input"
                            placeholder="Write a comment..."
                            className="soft-input min-h-[80px] w-full p-3 outline-none"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button
                            data-testid="edit-comment-submit"
                            onClick={handleAddComment}
                            className="primary-button"
                        >
                            Post
                        </button>
                    </div>
                    {commentError && <p className="text-red-500 mb-4">{commentError}</p>}

                    {comments.length > 0 ? (
                        <ul className="space-y-4">
                            {comments.map((comment) => (
                                <li key={comment._id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                    <div className="flex items-center gap-4 mb-2">
                                        <Image
                                            src={comment.user.profilePic}
                                            alt={comment.user.name}
                                            width={40}
                                            height={40}
                                            className="rounded-full"
                                        />
                                        <div>
                                            <p className="font-bold">{comment.user.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(comment.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Editable Comment Content */}
                                    {comment.isEditing ? (
                                        <textarea
                                            className="w-full border rounded-md p-2 mb-2"
                                            value={comment.editContent || comment.content}
                                            onChange={(e) =>
                                                setComments((prev) =>
                                                    prev.map((c) =>
                                                        c._id === comment._id
                                                            ? { ...c, editContent: e.target.value }
                                                            : c
                                                    )
                                                )
                                            }
                                        />
                                    ) : (
                                        <p className="text-gray-800">{comment.content}</p>
                                    )}

                                    <div className="flex gap-4 mt-2 items-center">
                                        <button
                                            onClick={() =>
                                                comment.likes.includes(currentUserId)
                                                    ? handleUnlikeComment(comment._id)
                                                    : handleLikeComment(comment._id)
                                            }
                                            className="flex items-center gap-1 text-primary hover:underline"
                                        >
                                            <ThumbsUp
                                                className={`w-5 h-5 ${comment.likes.includes(currentUserId) ? "fill-primary" : "stroke-primary"
                                                    }`}
                                            />
                                            <span>{comment.likes.length}</span>
                                        </button>

                                        {comment.user._id === currentUserId && (
                                            <>
                                                {comment.isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                handleEditComment(comment._id, comment.editContent || comment.content)
                                                            }
                                                            className="flex items-center gap-1 text-primary hover:underline"
                                                        >
                                                            <Edit className="w-5 h-5 stroke-primary" />
                                                            <span>Save</span>
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                setComments((prev) =>
                                                                    prev.map((c) =>
                                                                        c._id === comment._id
                                                                            ? { ...c, isEditing: false, editContent: undefined }
                                                                            : c
                                                                    )
                                                                )
                                                            }
                                                            className="flex items-center gap-1 text-red-500 hover:underline"
                                                        >
                                                            <Trash2 className="w-5 h-5 stroke-red-500" />
                                                            <span>Cancel</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                setComments((prev) =>
                                                                    prev.map((c) =>
                                                                        c._id === comment._id ? { ...c, isEditing: true } : c
                                                                    )
                                                                )
                                                            }
                                                            className="flex items-center gap-1 text-primary hover:underline"
                                                        >
                                                            <Edit className="w-5 h-5 stroke-primary" />
                                                            <span>Edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteComment(comment._id)}
                                                            className="flex items-center gap-1 text-red-500 hover:underline"
                                                        >
                                                            <Trash2 className="w-5 h-5 stroke-red-500" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Replies Section */}
                                    <div className="mt-4 pl-6 border-l">
                                        <h3 className="text-sm font-bold text-gray-700 mb-2">Replies</h3>
                                        <ul className="space-y-2">
                                            {comment.replies.map((reply, index) => (
                                                <li key={index} className="p-2 border rounded-md">
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <Image
                                                            src={reply.user.profilePic}
                                                            alt={reply.user.name}
                                                            width={30}
                                                            height={30}
                                                            className="rounded-full"
                                                        />
                                                        <div>
                                                            <p className="font-bold">{reply.user.name}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {new Date(reply.createdAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-800">{reply.content}</p>
                                                    <div className="flex gap-4 mt-2 items-center">
                                                        <button
                                                            onClick={() => handleLikeReply(comment._id, index)}
                                                            className="flex items-center gap-1 text-primary hover:underline"
                                                        >
                                                            <ThumbsUp
                                                                className={`w-4 h-4 ${reply.likes.includes(currentUserId)
                                                                    ? "fill-primary"
                                                                    : "stroke-primary"
                                                                    }`}
                                                            />
                                                            <span>{reply.likes.length}</span>
                                                        </button>
                                                        {reply.user._id === currentUserId && (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        handleEditReply(comment._id, index, "Updated reply content")
                                                                    }
                                                                    className="flex items-center gap-1 text-primary hover:underline"
                                                                >
                                                                    <Edit className="w-4 h-4 stroke-primary" />
                                                                    <span>Edit</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteReply(comment._id, index)}
                                                                    className="flex items-center gap-1 text-red-500 hover:underline"
                                                                >
                                                                    <Trash2 className="w-4 h-4 stroke-red-500" />
                                                                    <span>Delete</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-4">
                                            <textarea
                                                data-testid="edit-reply-input"
                                                placeholder="Write a reply..."
                                                className="p-2 w-full border rounded-md min-h-[60px]"
                                                value={comment.newReply || ""}
                                                onChange={(e) =>
                                                    setComments((prev) =>
                                                        prev.map((c) =>
                                                            c._id === comment._id ? { ...c, newReply: e.target.value } : c
                                                        )
                                                    )
                                                }
                                            />
                                            <button
                                                data-testid="edit-reply-submit"
                                                onClick={() => handleReplyToComment(comment._id, comment.newReply || "")}
                                                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 mt-2"
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                    )}
                </div>
            </div>
        </div>
    );
}
