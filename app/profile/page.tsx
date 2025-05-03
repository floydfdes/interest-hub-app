"use client";

import { useEffect, useState } from "react";
import { FiEdit, FiLogOut, FiSettings } from "react-icons/fi";

import { useRouter } from "next/navigation";
import Avatar from "react-avatar";
import { getMe } from "../api/api";
import { IUser } from "../types/user";

export default function ProfilePage() {
    const [user, setUser] = useState<IUser | null>(null);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("You must be logged in");

                const userData = await getMe() as { user: IUser };
                setUser(userData.user);
                localStorage.setItem("user", JSON.stringify(userData.user));
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to fetch user");
            }
        };

        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        router.push("/login");
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
                <h1 className="text-2xl text-red-600 font-semibold mb-4">Error</h1>
                <p className="text-gray-700">{error}</p>
            </div>
        );
    }

    if (!user) {
        return <div className="text-center mt-12 text-gray-500">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background p-8 flex flex-col lg:flex-row gap-8 justify-center">
            {/* Left Panel */}
            <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-sm text-center">
                <div className="flex justify-center mb-4">
                    <Avatar
                        name={user.name}
                        src={user.profilePic || undefined}
                        round
                        size="100"
                        textSizeRatio={2}
                    />
                </div>
                <h2 className="text-xl font-bold text-primary mb-1">{user.name}</h2>
                <p className="text-gray-500 mb-6">{user.email}</p>

                <div className="space-y-3">
                    <button
                        onClick={() => router.push("/profile/edit")}
                        className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-md hover:bg-gray-50"
                    >
                        <FiEdit size={16} />
                        Edit Profile
                    </button>
                    <button
                        onClick={() => router.push("/profile/settings")}
                        className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-md hover:bg-gray-50"
                    >
                        <FiSettings size={16} />
                        Settings
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 border border-red-300 text-red-500 py-2 rounded-md hover:bg-red-50"
                    >
                        <FiLogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>

            {/* Right Panel */}
            <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl">
                <h2 className="text-2xl font-semibold text-primary mb-6">Profile Details</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-base">
                    {/* Name */}
                    <div>
                        <label className="text-gray-500 text-sm block mb-1">Name</label>
                        <div className="bg-gray-100 p-3 rounded-md text-gray-800">{user.name}</div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-gray-500 text-sm block mb-1">Email</label>
                        <div className="bg-gray-100 p-3 rounded-md text-gray-800">{user.email}</div>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                        <div className="sm:col-span-2">
                            <label className="text-gray-500 text-sm block mb-1">Bio</label>
                            <div className="bg-gray-100 p-3 rounded-md text-gray-800 whitespace-pre-line">
                                {user.bio}
                            </div>
                        </div>
                    )}

                    {/* Followers */}
                    <div>
                        <label className="text-gray-500 text-sm block mb-1">Followers</label>
                        <div className="bg-gray-100 p-3 rounded-md text-gray-800">
                            {user.followers?.length || 0}
                        </div>
                    </div>

                    {/* Following */}
                    <div>
                        <label className="text-gray-500 text-sm block mb-1">Following</label>
                        <div className="bg-gray-100 p-3 rounded-md text-gray-800">
                            {user.following?.length || 0}
                        </div>
                    </div>

                    {/* Interests */}
                    {user.interests?.length > 0 && (
                        <div className="sm:col-span-2">
                            <label className="text-gray-500 text-sm block mb-1">Interests</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {user.interests.map((interest) => (
                                    <span
                                        key={interest}
                                        className="bg-primary text-white text-sm px-3 py-1 rounded-full"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
