"use client";

import { useRef, useState } from "react";
import { App } from "antd";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPost, getErrorMessage } from "../api/api";
import { compressAndConvertToBase64 } from "../api/imageUtil";
import { PostInput } from "../types/user";
import MentionSuggestions from "@/components/features/MentionSuggestions";
import TagSuggestionChips from "@/components/features/TagSuggestionChips";
import { getModerationNoticeMessage } from "../utils/moderation";
import { applyTagSuggestion, parseAndValidateTags } from "../utils/postTags";

const categories = ["Tech", "Health", "Travel", "Design", "Education"];
const visibilities = [
    { value: "public", label: "Public" },
    { value: "followersOnly", label: "Followers only" },
    { value: "private", label: "Only me" },
] as const;
type EditablePost = Omit<PostInput, "tags"> & { tags: string };

export default function CreatePostPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { message } = App.useApp();

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

            const { tags: tagText, ...postFields } = form;
            const { tags, error: tagError } = parseAndValidateTags(tagText);
            if (tagError) {
                setError(tagError);
                return;
            }

            const payload = {
                ...postFields,
                ...(tags.length > 0 ? { tags } : {}),
            };

            const response = await createPost(payload);
            const moderationMessage = getModerationNoticeMessage(response);
            if (moderationMessage) message.warning(moderationMessage);
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
                    placeholder="Write something interesting... use @username or #tag"
                    className="soft-input mb-3 min-h-[120px] w-full resize-none p-4 outline-none"
                    value={form.content}
                    onChange={(e) => handleChange("content", e.target.value)}
                />
                <MentionSuggestions value={form.content} onChange={(value) => handleChange("content", value)} />

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
                <TagSuggestionChips
                    value={form.tags}
                    onSelect={(tag) => handleChange("tags", applyTagSuggestion(form.tags, tag))}
                />
                <p className="-mt-3 mb-5 text-xs text-slate-400">Optional. Use commas between tags. Letters, numbers, underscores, and hyphens only.</p>

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
                        <option key={option.value} value={option.value}>
                            {option.label}
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
