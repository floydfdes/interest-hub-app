/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { getPostById, updatePost } from "@/app/api/api";
import { compressAndConvertToBase64, resizeImageToBase64 } from "@/app/api/imageUtil";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { IPost } from "@/app/types/user";
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

    useEffect(() => {
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
            } catch (err: any) {
                setError("Failed to fetch post");
            } finally {
                setLoading(false);
            }
        };
        if (postId) fetchPost();
    }, [postId]);

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
                    className="w-full bg-primary text-white py-3 rounded-md hover:bg-opacity-90"
                >
                    Update Post
                </button>
            </div>
        </div>
    );
}


