"use client";

import { useEffect, useState } from "react";
import { FiActivity, FiEdit, FiLogOut, FiSettings } from "react-icons/fi";

import { useRouter } from "next/navigation";
import Avatar from "react-avatar";
import { getMe } from "../api/api";
import { IUser } from "../types/user";
import { notifyAuthChanged } from "../hooks/useCurrentUser";

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
                notifyAuthChanged();
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to fetch user");
            }
        };

        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        notifyAuthChanged();
        setUser(null);
        router.push("/login");
    };

    if (error) {
        return (
            <div className="surface shell-container max-w-md p-10 text-center">
                <h1 className="mb-4 text-2xl font-semibold text-slate-900">Profile unavailable</h1>
                <p className="text-slate-500">{error}</p>
            </div>
        );
    }

    if (!user) {
        return <div className="surface shell-container max-w-4xl p-12 text-center text-slate-500">Loading profile...</div>;
    }

    return (
        <div className="shell-container">
            <div className="mb-8">
                <span className="eyebrow">Profile</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Your space</h1>
            </div>
            <div className="flex flex-col gap-7 lg:flex-row">
            <aside className="surface w-full max-w-sm p-7 text-center">
                <div className="mb-5 flex justify-center">
                    <Avatar
                        name={user.name}
                        src={user.profilePic || undefined}
                        round
                        size="104"
                        textSizeRatio={2}
                    />
                </div>
                <h2 className="mb-1 text-2xl font-bold tracking-tight text-slate-900">{user.name}</h2>
                <p className="mb-7 text-sm text-slate-500">{user.email}</p>

                <div className="space-y-3">
                    <button
                        onClick={() => router.push("/profile/edit")}
                        className="secondary-button w-full"
                    >
                        <FiEdit size={16} />
                        Edit Profile
                    </button>
                    <button
                        onClick={() => router.push("/profile/settings")}
                        className="secondary-button w-full"
                    >
                        <FiSettings size={16} />
                        Settings
                    </button>
                    <button
                        onClick={() => router.push("/profile/activities")}
                        className="secondary-button w-full"
                    >
                        <FiActivity size={16} />
                        Activity
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-100 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
                    >
                        <FiLogOut size={16} />
                        Logout
                    </button>
                </div>
            </aside>

            <section className="surface w-full p-6 sm:p-8">
                <h2 className="mb-7 text-2xl font-semibold tracking-tight text-slate-900">Profile details</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-base">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-400">Name</label>
                        <div className="rounded-xl bg-slate-50 p-4 text-slate-700">{user.name}</div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-400">Email</label>
                        <div className="rounded-xl bg-slate-50 p-4 text-slate-700">{user.email}</div>
                    </div>

                    {user.bio && (
                        <div className="sm:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-slate-400">Bio</label>
                            <div className="whitespace-pre-line rounded-xl bg-slate-50 p-4 leading-7 text-slate-700">
                                {user.bio}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-400">Followers</label>
                        <div className="rounded-xl bg-indigo-50 p-4 text-2xl font-semibold text-indigo-700">
                            {user.followers?.length || 0}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-400">Following</label>
                        <div className="rounded-xl bg-teal-50 p-4 text-2xl font-semibold text-teal-700">
                            {user.following?.length || 0}
                        </div>
                    </div>

                    {user.interests?.length > 0 && (
                        <div className="sm:col-span-2">
                            <label className="mb-3 block text-sm font-medium text-slate-400">Interests</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {user.interests.map((interest) => (
                                    <span
                                        key={interest}
                                        className="tag-pill"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
            </div>
        </div>
    );
}
