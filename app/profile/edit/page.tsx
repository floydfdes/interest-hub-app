"use client";

import { FiArrowLeft, FiTrash, FiUpload } from "react-icons/fi";
import { getErrorMessage, getMe, updateUser } from "@/app/api/api";
import { useEffect, useRef, useState } from "react";

import Avatar from "react-avatar";
import { IUser } from "@/app/types/user";
import { resizeImageToBase64 } from "@/app/api/imageUtil";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [user, setUser] = useState<IUser | null>(null);
    const [form, setForm] = useState({
        name: "",
        bio: "",
        interests: "",
        profilePic: "",
    });
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [bioCharCount, setBioCharCount] = useState(0);
    const MAX_BIO_LENGTH = 160;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("You must be logged in");

                const data = await getMe() as { user: IUser };
                setUser(data.user);
                setForm({
                    name: data.user.name || "",
                    bio: data.user.bio || "",
                    interests: data.user.interests?.join(", ") || "",
                    profilePic: data.user.profilePic || "",
                });
                setPreview(data.user.profilePic || "");
                setBioCharCount(data.user.bio?.length || 0);
            } catch (err: unknown) {
                setError(getErrorMessage(err, "Failed to fetch user"));
            }
        };

        fetchUser();
    }, []);

    const handleImageUpload = async (file: File) => {
        const base64 = await resizeImageToBase64(file, 200, 200);
        if (base64) {
            setForm((prev) => ({ ...prev, profilePic: base64 }));
            setPreview(base64);
        } else {
            setError("Image upload failed");
        }
    };

    const handleRemovePicture = () => {
        setForm((prev) => ({ ...prev, profilePic: "" }));
        setPreview("");
    };

    const handleSubmit = async () => {
        if (form.bio.length > MAX_BIO_LENGTH) {
            setError("Bio exceeds character limit");
            return;
        }

        try {
            setError("");
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Unauthorized");

            const payload = {
                name: form.name,
                bio: form.bio,
                interests: form.interests.split(",").map((i) => i.trim()),
                profilePic: form.profilePic,
            };

            await updateUser(payload);
            router.push("/profile");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Failed to update profile"));
        }
    };

    if (!user) return <div className="surface shell-container max-w-2xl p-12 text-center text-slate-500">Loading profile...</div>;

    return (
        <div className="shell-container flex justify-center">
            <div className="surface w-full max-w-2xl p-6 sm:p-8">

                {/* Back link */}
                <button
                    onClick={() => router.push("/profile")}
                    className="mb-6 flex items-center gap-1 text-sm font-medium text-indigo-600"
                >
                    <FiArrowLeft /> Back to Profile
                </button>

                {/* Title */}
                <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-slate-900">Edit profile</h1>
                {error && <p className="text-center text-red-500 mb-4">{error}</p>}

                {/* Avatar + Remove */}
                <div className="flex flex-col justify-center items-center mb-4">
                    <Avatar
                        name={form.name}
                        src={preview || undefined}
                        round
                        size="90"
                        textSizeRatio={2}
                    />
                    {preview && (
                        <button
                            onClick={handleRemovePicture}
                            className="mt-2 flex items-center text-sm font-medium text-rose-500 hover:text-rose-600"
                        >
                            <FiTrash className="mr-1" size={14} /> Remove Picture
                        </button>
                    )}
                </div>

                {/* Upload Button */}
                <div className="flex justify-center mb-6">
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
                        onClick={() => fileInputRef.current?.click()}
                        className="secondary-button"
                    >
                        <FiUpload size={16} /> Upload New Profile Picture
                    </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-700 mb-1 block">Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="soft-input w-full px-4 text-sm outline-none"
                            placeholder="Your Name"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-700 mb-1 block">Bio</label>
                        <textarea
                            value={form.bio}
                            onChange={(e) => {
                                const input = e.target.value;
                                const trimmed = input.slice(0, MAX_BIO_LENGTH);
                                setForm((prev) => ({ ...prev, bio: trimmed }));
                                setBioCharCount(trimmed.length);
                            }}

                            className="soft-input min-h-[100px] w-full px-4 py-3 text-sm outline-none"
                            placeholder="Write a short bio"
                        />
                        <p
                            className={`text-xs mt-1 text-right ${bioCharCount > MAX_BIO_LENGTH ? "text-red-500" : "text-gray-500"}`}
                        >
                            {bioCharCount}/{MAX_BIO_LENGTH} characters
                        </p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-700 mb-1 block">Interests (comma separated)</label>
                        <input
                            type="text"
                            value={form.interests}
                            onChange={(e) => setForm((prev) => ({ ...prev, interests: e.target.value }))}
                            className="soft-input w-full px-4 text-sm outline-none"
                            placeholder="e.g., tech, travel"
                        />
                    </div>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    className="primary-button mt-7 w-full"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
}
