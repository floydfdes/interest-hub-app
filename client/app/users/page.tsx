/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { followUser, getMe, searchUsers, unfollowUser } from "@/app/api/api";
import { useEffect, useMemo, useState } from "react";

import Avatar from "react-avatar";
import { IUser } from "@/app/types/user";
import { formatDistanceToNow } from "date-fns";

export default function UserSearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<IUser[]>([]);
    const [filteredResults, setFilteredResults] = useState<IUser[]>([]);
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
            } catch (e: any) {
                console.log(e);
                setError("Failed to load user data");
            }
        };
        fetchInitial();
    }, []);

    const handleSearch = async () => {
        try {
            const users = await searchUsers(query) as IUser[];
            setResults(users);
        } catch (e: any) {
            console.log(e);
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

    useEffect(() => {
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

        setFilteredResults(filtered);
    }, [results, selectedInterest, sortBy]);

    return (
        <div className="min-h-screen bg-background p-6 flex flex-col items-center">
            <h1 className="text-4xl font-bold text-primary mb-6">Search Users</h1>

            {/* Controls */}
            <div className="w-full max-w-4xl flex flex-wrap gap-3 mb-6">
                <input
                    type="text"
                    placeholder="Search by name or interest..."
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-primary text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button
                    onClick={handleSearch}
                    className="px-5 py-2 rounded-md bg-primary text-white hover:bg-opacity-90 text-sm"
                >
                    Search
                </button>
                <select
                    value={selectedInterest}
                    onChange={(e) => setSelectedInterest(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm"
                >
                    {uniqueInterests.map((interest) => (
                        <option key={interest}>{interest}</option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm"
                >
                    <option value="name">Sort by Name</option>
                    <option value="followers">Sort by Followers</option>
                </select>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* Results */}
            <div className="w-full max-w-4xl space-y-4">
                {filteredResults.map((user) => {
                    const isFollowing = followingIds.includes(user._id);
                    return (
                        <div
                            key={user._id}
                            className="border border-gray-200 bg-white rounded-md px-5 py-4 flex justify-between items-center"
                        >
                            <div className="flex items-start sm:items-center gap-4 w-full">
                                <Avatar
                                    name={user.name}
                                    src={user.profilePic || undefined}
                                    size="50"
                                    round
                                />
                                <div className="flex-grow">
                                    <p className="font-semibold text-primary">{user.name}</p>
                                    {user.bio && (
                                        <p className="text-sm text-gray-600">{user.bio}</p>
                                    )}
                                    {user.interests?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {user.interests.map((i) => (
                                                <span
                                                    key={i}
                                                    className="bg-secondary text-white text-xs px-2 py-0.5 rounded-full"
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
                                className={`ml-4 px-4 py-1.5 text-sm rounded-md font-medium text-white ${isFollowing
                                    ? "bg-red-500 hover:bg-red-600"
                                    : "bg-primary hover:bg-opacity-90"
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
