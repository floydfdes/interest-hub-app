"use client";

import { followUser, getMe, searchUsers, unfollowUser } from "@/app/api/api";
import { useEffect, useMemo, useState } from "react";

import Avatar from "react-avatar";
import { IUser } from "@/app/types/user";
import { formatDistanceToNow } from "date-fns";
import { Search, UsersRound } from "lucide-react";

export default function UserSearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<IUser[]>([]);
    const [followingIds, setFollowingIds] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [selectedInterest, setSelectedInterest] = useState("All");
    const [sortBy, setSortBy] = useState("name");

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const me = await getMe() as { user: IUser };
                setFollowingIds(me.user.following || []);
                const initialUsers = await searchUsers("") as IUser[];
                setResults(initialUsers);
            } catch {
                setError("Failed to load user data");
            }
        };
        fetchInitial();
    }, []);

    const handleSearch = async () => {
        try {
            const users = await searchUsers(query) as IUser[];
            setResults(users);
        } catch {
            setError("Search failed");
        }
    };

    const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
        try {
            if (isFollowing) {
                await unfollowUser(userId);
                setFollowingIds((prev) => prev.filter((id) => id !== userId));
            } else {
                await followUser(userId);
                setFollowingIds((prev) => [...prev, userId]);
            }
        } catch {
            setError("Failed to update follow status");
        }
    };

    const uniqueInterests = useMemo(() => {
        const all = results.flatMap((u) => u.interests || []);
        return ["All", ...Array.from(new Set(all))];
    }, [results]);

    const filteredResults = useMemo(() => {
        let filtered = [...results];

        if (selectedInterest !== "All") {
            filtered = filtered.filter((user) =>
                user.interests?.includes(selectedInterest)
            );
        }

        if (sortBy === "name") {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === "followers") {
            filtered.sort((a, b) => (b.followers?.length || 0) - (a.followers?.length || 0));
        }

        return filtered;
    }, [results, selectedInterest, sortBy]);

    return (
        <div className="shell-container">
            <header className="mb-8">
                <span className="eyebrow"><UsersRound size={12} /> Community</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Find your people</h1>
                <p className="mt-2 text-slate-500">Discover creators through the interests you share.</p>
            </header>

            <div className="surface mb-7 flex w-full flex-wrap gap-3 p-4">
                <input
                    data-testid="users-search-input"
                    type="text"
                    placeholder="Search by name or interest..."
                    className="soft-input min-w-[15rem] flex-grow px-4 text-sm outline-none"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button
                    data-testid="users-search-button"
                    onClick={handleSearch}
                    className="primary-button"
                >
                    <Search size={15} /> Search
                </button>
                <select
                    value={selectedInterest}
                    onChange={(e) => setSelectedInterest(e.target.value)}
                    className="soft-input px-4 text-sm text-slate-600 outline-none"
                >
                    {uniqueInterests.map((interest) => (
                        <option key={interest}>{interest}</option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="soft-input px-4 text-sm text-slate-600 outline-none"
                >
                    <option value="name">Sort by Name</option>
                    <option value="followers">Sort by Followers</option>
                </select>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* Results */}
            <div className="grid w-full gap-4 lg:grid-cols-2">
                {filteredResults.map((user) => {
                    const isFollowing = followingIds.includes(user._id);
                    return (
                        <div
                            key={user._id}
                            className="surface flex items-center justify-between gap-4 px-5 py-5"
                        >
                            <div className="flex items-start sm:items-center gap-4 w-full">
                                <Avatar
                                    name={user.name}
                                    src={user.profilePic || undefined}
                                    size="50"
                                    round
                                />
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-900">{user.name}</p>
                                    {user.bio && (
                                        <p className="text-sm text-gray-600">{user.bio}</p>
                                    )}
                                    {user.interests?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {user.interests.map((i) => (
                                                <span
                                                    key={i}
                                                    className="tag-pill !px-2 !py-0.5"
                                                >
                                                    {i}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Followers: {user.followers?.length || 0} • Following: {user.following?.length || 0} • Joined{" "}
                                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                                    </p>

                                </div>
                            </div>
                            <button
                                onClick={() => handleFollowToggle(user._id, isFollowing)}
                                className={`ml-4 rounded-xl px-4 py-2 text-sm font-semibold transition ${isFollowing
                                    ? "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                                    }`}
                            >
                                {isFollowing ? "Unfollow" : "Follow"}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
