/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createComment, deleteComment, deleteReply, editComment, editReply, getPostById, likeComment, likeReply, replyToComment, replyToReply, unlikeComment, unlikeReply, updatePost } from "@/app/api/api";
import { compressAndConvertToBase64, resizeImageToBase64 } from "@/app/api/imageUtil";
import { IComment, IPost } from "@/app/types/user";
import { Edit, ThumbsUp, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import Image from "next/image";

const categories = ["Tech", "Health", "Travel", "Design", "Education"];
const visibilities = ["public", "private", "followersOnly"];

export default function EditPostPage() {
    const router = useRouter();
    const params = useParams();
    const postId = params?.id as string;
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [form, setForm] = useState({
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
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserId = currentUser._id;

    useEffect(() => {
        if (postId) {
            fetchPost();
        }
    }, [postId]);

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
        } catch (err: any) {
            setError("Failed to fetch post");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string | string[]) => {
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
                ...form,
                tags: form.tags.split(",").map((t) => t.trim()),
            };

            await updatePost(postId, payload);
            router.push("/explore");
        } catch (err: any) {
            setError(err.message || "Update failed");
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
        } catch (err: any) {
            setCommentError(err.message || "Failed to add comment");
        }
    };

    const handleEditComment = async (commentId: string, updatedContent: string) => {
        try {
            await editComment(commentId, updatedContent);
            await fetchPost();
        } catch (err: any) {
            setCommentError(err.message || "Failed to edit comment");
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await deleteComment(commentId);
            await fetchPost();
        } catch (err: any) {
            setCommentError(err.message || "Failed to delete comment");
        }
    };

    const handleLikeComment = async (commentId: string) => {
        try {
            await likeComment(commentId);
            await fetchPost();
        } catch (err: any) {
            setCommentError(err.message || "Failed to like comment");
        }
    };

    const handleUnlikeComment = async (commentId: string) => {
        try {
            await unlikeComment(commentId);
            await fetchPost();
        } catch (err: any) {
            setCommentError(err.message || "Failed to unlike comment");
        }
    };

    const handleReplyToComment = async (commentId: string, replyContent: string) => {
        try {
            await replyToComment(commentId, replyContent);
            await fetchPost();
        } catch (err: any) {
            setCommentError(err.message || "Failed to reply to comment");
        }
    };

    const handleEditReply = async (commentId: string, replyIndex: number, updatedContent: string) => {
        try {
            await editReply(commentId, replyIndex, updatedContent);
            await fetchPost();
        } catch (err: any) {
            setCommentError(err.message || "Failed to edit reply");
        }
    };

    const handleDeleteReply = async (commentId: string, replyIndex: number) => {
        try {
            await deleteReply(commentId, replyIndex);
            await fetchPost();
        } catch (err: any) {
            setCommentError(err.message || "Failed to delete reply");
        }
    };

    const handleLikeReply = async (commentId: string, replyIndex: number) => {
        try {
            await likeReply(commentId, replyIndex);
            await fetchPost();
        } catch (err: any) {
            setCommentError(err.message || "Failed to like reply");
        }
    };

    const handleUnlikeReply = async (commentId: string, replyIndex: number) => {
        try {
            await unlikeReply(commentId, replyIndex);
            await fetchPost();
        } catch (err: any) {
            setCommentError(err.message || "Failed to unlike reply");
        }
    };

    const handleReplyToReply = async (
        commentId: string,
        parentReplyIndex: number,
        replyContent: string
    ) => {
        try {
            await replyToReply(commentId, parentReplyIndex, replyContent);
            await fetchPost();
        } catch (err: any) {
            setCommentError(err.message || "Failed to reply to reply");
        }
    };

    if (loading) return <div className="text-center py-10">Loading...</div>;

    return (
        <div className="min-h-screen bg-background flex justify-center items-center px-4 py-10">
            <div className="w-full max-w-2xl bg-white shadow-md rounded-lg p-6">
                <h1 className="text-3xl font-bold text-primary mb-6 text-center">Edit Post</h1>

                {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                <input
                    type="text"
                    placeholder="Post Title"
                    className="mb-4 p-3 w-full border rounded-md"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                />

                <textarea
                    placeholder="Content"
                    className="mb-4 p-3 w-full border rounded-md min-h-[120px]"
                    value={form.content}
                    onChange={(e) => handleChange("content", e.target.value)}
                />

                <select
                    className="mb-4 p-3 w-full border rounded-md"
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                        <option key={cat}>{cat}</option>
                    ))}
                </select>

                <input
                    type="text"
                    placeholder="Tags (comma-separated)"
                    className="mb-4 p-3 w-full border rounded-md"
                    value={form.tags}
                    onChange={(e) => handleChange("tags", e.target.value)}
                />

                <div className="mb-4">
                    <p className="text-sm font-medium mb-2 text-gray-700">Update Image</p>
                    <div className="flex gap-4 flex-col sm:flex-row">
                        <input
                            type="text"
                            placeholder="Paste Image URL"
                            className="p-3 border w-full rounded-md"
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
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300"
                        >
                            Upload
                        </button>
                    </div>
                </div>

                {imagePreview && (
                    <div className="relative w-full h-52 mb-6 border rounded-md overflow-hidden">
                        <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover rounded-md"
                            sizes="(max-width: 768px) 100vw, 600px"
                        />
                    </div>
                )}

                <select
                    className="mb-6 p-3 w-full border rounded-md"
                    value={form.visibility}
                    onChange={(e) => handleChange("visibility", e.target.value)}
                >
                    {visibilities.map((option) => (
                        <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleSubmit}
                    className="w-full bg-primary text-white py-3 rounded-md hover:bg-opacity-90 mb-6"
                >
                    Update Post
                </button>

                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-primary mb-4">Comments</h2>

                    <div className="flex items-start gap-4 mb-6">
                        <textarea
                            placeholder="Write a comment..."
                            className="p-3 w-full border rounded-md min-h-[80px]"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button
                            onClick={handleAddComment}
                            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90"
                        >
                            Post
                        </button>
                    </div>
                    {commentError && <p className="text-red-500 mb-4">{commentError}</p>}

                    {comments.length > 0 ? (
                        <ul className="space-y-4">
                            {comments.map((comment) => (
                                <li key={comment._id} className="p-4 border rounded-md">
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
                                    <p className="text-gray-800">{comment.content}</p>
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
                                                <button
                                                    onClick={() => handleEditComment(comment._id, "Updated content")}
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


