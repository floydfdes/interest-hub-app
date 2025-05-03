/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPost } from "../api/api";
import { compressAndConvertToBase64 } from "../api/imageUtil";

const categories = ["Tech", "Health", "Travel", "Design", "Education"];
const visibilities = ["public", "private", "followersOnly"];

export default function CreatePostPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [form, setForm] = useState({
        title: "",
        content: "",
        category: "",
        tags: "",
        image: "",
        visibility: "public",
    });

    const [error, setError] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleChange = (field: string, value: string | string[]) => {
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
        } catch (e: any) {
            console.log(e);
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
        } catch (err: any) {
            setError(err.message || "Failed to create post");
        }
    };

    return (
        <div className="min-h-screen bg-background flex justify-center items-center px-4 py-10">
            <div className="w-full max-w-2xl bg-white shadow-lg rounded-xl p-8">
                <h1 className="text-3xl font-semibold text-primary mb-8 text-center">
                    Create a New Post
                </h1>

                {error && (
                    <p className="text-red-500 text-center mb-4 font-medium">{error}</p>
                )}

                {/* Title */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Post Title</label>
                <input
                    type="text"
                    placeholder="Enter a catchy title"
                    className="mb-5 p-3 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                />

                {/* Content */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                    placeholder="Write something interesting..."
                    className="mb-5 p-3 w-full border rounded-md min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={form.content}
                    onChange={(e) => handleChange("content", e.target.value)}
                />

                {/* Category */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                    className="mb-5 p-3 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                    className="mb-5 p-3 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                            className="p-3 border w-full rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                            className="bg-gray-100 px-4 py-2 rounded-md border hover:bg-gray-200 transition text-sm"
                        >
                            Upload
                        </button>
                    </div>
                </div>

                {/* Preview */}
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


                {/* Visibility */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select
                    className="mb-8 p-3 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                    className="w-full bg-primary text-white py-3 rounded-md hover:bg-opacity-90 transition text-base font-medium"
                >
                    Publish Post
                </button>
            </div>
        </div>
    );
}
