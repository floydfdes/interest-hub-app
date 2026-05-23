"use client";

import { useRef, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPost, getErrorMessage } from "../api/api";
import { compressAndConvertToBase64 } from "../api/imageUtil";
import { PostInput } from "../types/user";

const categories = ["Tech", "Health", "Travel", "Design", "Education"];
const visibilities = ["public", "private", "followersOnly"];
type EditablePost = Omit<PostInput, "tags"> & { tags: string };

export default function CreatePostPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [form, setForm] = useState<EditablePost>({
        title: "",
        content: "",
        category: "",
        tags: "",
        image: "",
        visibility: "public",
    });

    const [error, setError] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleChange = (field: keyof EditablePost, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleImageURL = async (url: string) => {
        try {
            const base64 = await compressAndConvertToBase64(url);
            if (base64) {
                setImagePreview(base64);
                handleChange("image", base64);
            } else {
                setError("Failed to load image from URL");
            }
        } catch {
            setError("Invalid image URL");
        }
    };

    const handleImageUpload = async (file: File) => {
        const base64 = await compressAndConvertToBase64(file);
        if (base64) {
            setImagePreview(base64);
            handleChange("image", base64);
        }
    };

    const handleSubmit = async () => {
        try {
            setError("");
            const token = localStorage.getItem("token");
            if (!token) throw new Error("You must be logged in");

            const payload = {
                ...form,
                tags: form.tags.split(",").map((tag) => tag.trim()),
            };

            await createPost(payload);
            router.push("/explore");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Failed to create post"));
        }
    };

    return (
        <div className="shell-container flex justify-center">
            <div className="surface w-full max-w-3xl p-6 sm:p-8">
                <span className="eyebrow">New post</span>
                <h1 className="mb-8 mt-4 text-3xl font-bold tracking-tight text-slate-900">
                    Create a new post
                </h1>

                {error && (
                    <p className="text-red-500 text-center mb-4 font-medium">{error}</p>
                )}

                {/* Title */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Post Title</label>
                <input
                    type="text"
                    placeholder="Enter a catchy title"
                    className="soft-input mb-5 w-full px-4 outline-none"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                />

                {/* Content */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                    placeholder="Write something interesting..."
                    className="soft-input mb-5 min-h-[120px] w-full resize-none p-4 outline-none"
                    value={form.content}
                    onChange={(e) => handleChange("content", e.target.value)}
                />

                {/* Category */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                    className="soft-input mb-5 w-full px-4 outline-none"
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                        <option key={cat}>{cat}</option>
                    ))}
                </select>

                {/* Tags */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                    type="text"
                    placeholder="e.g. react, ui, tailwind"
                    className="soft-input mb-5 w-full px-4 outline-none"
                    value={form.tags}
                    onChange={(e) => handleChange("tags", e.target.value)}
                />

                {/* Upload / URL */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Image or Paste URL
                    </label>
                    <div className="flex gap-3 flex-col sm:flex-row">
                        <input
                            type="text"
                            placeholder="Paste image URL"
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
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="secondary-button"
                        >
                            Upload
                        </button>
                    </div>
                </div>

                {/* Preview */}
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


                {/* Visibility */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select
                    className="soft-input mb-8 w-full px-4 outline-none"
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
                    className="primary-button w-full"
                >
                    Publish Post
                </button>
            </div>
        </div>
    );
}
