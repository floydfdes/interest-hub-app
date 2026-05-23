/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FiArrowLeft, FiTrash, FiUpload } from "react-icons/fi";
import { getMe, updateUser } from "@/app/api/api";
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
            } catch (err: any) {
                setError(err.message || "Failed to fetch user");
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
        } catch (err: any) {
            setError(err.message || "Failed to update profile");
        }
    };

    if (!user) return <div className="text-center mt-10 text-gray-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-background px-4 py-10 flex justify-center items-start">
            <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6">

                {/* Back link */}
                <button
                    onClick={() => router.push("/profile")}
                    className="mb-6 text-sm text-primary hover:underline flex items-center gap-1"
                >
                    <FiArrowLeft /> Back to Profile
                </button>

                {/* Title */}
                <h1 className="text-2xl font-bold text-primary mb-4 text-center">Edit Profile</h1>
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
                            className="mt-2 flex items-center text-sm text-red-500 hover:underline"
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
                        className="flex items-center gap-2 px-4 py-2 border rounded-md bg-gray-100 hover:bg-gray-200 transition text-sm"
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
                            className="w-full px-4 py-2 border rounded-md focus:outline-primary text-sm"
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

                            className="w-full px-4 py-2 border rounded-md min-h-[80px] focus:outline-primary text-sm"
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
                            className="w-full px-4 py-2 border rounded-md focus:outline-primary text-sm"
                            placeholder="e.g., tech, travel"
                        />
                    </div>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    className="w-full mt-6 py-3 rounded-md bg-primary text-white font-medium hover:bg-opacity-90 transition"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
}
