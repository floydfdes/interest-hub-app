"use client";

import { ApiError, blockUser, followUser, getMe, muteUser, searchUsers, unblockUser, unfollowUser, unmuteUser } from "@/app/api/api";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { IUser } from "@/app/types/user";
import { MoreHorizontal, Search, UsersRound } from "lucide-react";
import Avatar from "react-avatar";
import Swal from "sweetalert2";

export default function UserSearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<IUser[]>([]);
    const [followingIds, setFollowingIds] = useState<string[]>([]);
    const [blockedIds, setBlockedIds] = useState<string[]>([]);
    const [mutedIds, setMutedIds] = useState<string[]>([]);
    const [currentUserId, setCurrentUserId] = useState("");
    const [actionMenuUserId, setActionMenuUserId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [selectedInterest, setSelectedInterest] = useState("All");
    const [sortBy, setSortBy] = useState("name");
    const actionMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchInitial = async () => {
            if (localStorage.getItem("token")) {
                try {
                    const me = await getMe() as { user: IUser };
                    setCurrentUserId(me.user._id);
                    setFollowingIds(me.user.following || []);
                    setBlockedIds(me.user.blockedUsers || []);
                    setMutedIds(me.user.mutedUsers || []);
                } catch {
                    // People discovery is public; protected actions surface their own failures.
                }
            }

            try {
                const initialUsers = await searchUsers("") as IUser[];
                setResults(initialUsers);
            } catch {
                // Do not show a search failure until the user explicitly searches.
            }
        };
        void fetchInitial();
    }, []);

    useEffect(() => {
        if (!actionMenuUserId) return;

        const closeActionsOnOutsideClick = (event: MouseEvent) => {
            if (!actionMenuRef.current?.contains(event.target as Node)) {
                setActionMenuUserId(null);
            }
        };

        document.addEventListener("mousedown", closeActionsOnOutsideClick);
        return () => document.removeEventListener("mousedown", closeActionsOnOutsideClick);
    }, [actionMenuUserId]);

    const handleSearch = async () => {
        try {
            const users = await searchUsers(query) as IUser[];
            setResults(users);
        } catch {
            setError("Search failed");
        }
    };

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void handleSearch();
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
        } catch (err: unknown) {
            setError(err instanceof ApiError && err.status === 403
                ? "You cannot follow this user."
                : "Failed to update follow status");
        }
    };

    const handleBlockToggle = async (user: IUser, isBlocked: boolean) => {
        setActionMenuUserId(null);
        setError("");
        if (!isBlocked) {
            const confirmation = await Swal.fire({
                title: `Block ${user.name}?`,
                text: "Blocking this user will remove any follow connection between you.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Block user",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#e11d48",
            });
            if (!confirmation.isConfirmed) return;
        }

        try {
            if (isBlocked) {
                await unblockUser(user._id);
                setBlockedIds((previous) => previous.filter((id) => id !== user._id));
            } else {
                await blockUser(user._id);
                setBlockedIds((previous) => [...previous, user._id]);
                setFollowingIds((previous) => previous.filter((id) => id !== user._id));
            }
        } catch {
            setError(`Failed to ${isBlocked ? "unblock" : "block"} user`);
        }
    };

    const handleMuteToggle = async (user: IUser, isMuted: boolean) => {
        setActionMenuUserId(null);
        setError("");
        try {
            if (isMuted) {
                await unmuteUser(user._id);
                setMutedIds((previous) => previous.filter((id) => id !== user._id));
            } else {
                await muteUser(user._id);
                setMutedIds((previous) => [...previous, user._id]);
            }
        } catch {
            setError(`Failed to ${isMuted ? "unmute" : "mute"} user`);
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

            <form onSubmit={submitSearch} className="surface mb-7 flex w-full flex-wrap gap-3 p-4">
                <input
                    data-testid="users-search-input"
                    type="text"
                    placeholder="Search by name or interest..."
                    className="soft-input min-w-[15rem] flex-grow px-4 text-sm outline-none"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button
                    type="submit"
                    data-testid="users-search-button"
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
            </form>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* Results */}
            <div className="grid w-full gap-4 lg:grid-cols-2">
                {filteredResults.map((user) => {
                    const isFollowing = followingIds.includes(user._id);
                    const isBlocked = blockedIds.includes(user._id);
                    const isMuted = mutedIds.includes(user._id);
                    const isCurrentUser = user._id === currentUserId;
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
                                        Followers: {user.followers?.length || 0} • Following: {user.following?.length || 0}
                                    </p>

                                </div>
                            </div>
                            {!isCurrentUser && (
                                <div
                                    ref={actionMenuUserId === user._id ? actionMenuRef : undefined}
                                    className="relative ml-4 flex shrink-0 items-start gap-2"
                                >
                                    {!isBlocked && (
                                        <button
                                            onClick={() => handleFollowToggle(user._id, isFollowing)}
                                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${isFollowing
                                                ? "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                                                }`}
                                        >
                                            {isFollowing ? "Unfollow" : "Follow"}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        aria-label={`More actions for ${user.name}`}
                                        aria-expanded={actionMenuUserId === user._id}
                                        onClick={() => setActionMenuUserId((openId) => openId === user._id ? null : user._id)}
                                        className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                                    >
                                        <MoreHorizontal size={18} />
                                    </button>
                                    {actionMenuUserId === user._id && (
                                        <div className="absolute right-0 top-12 z-10 min-w-36 rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg">
                                            <button
                                                type="button"
                                                onClick={() => void handleMuteToggle(user, isMuted)}
                                                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                            >
                                                {isMuted ? "Unmute" : "Mute"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleBlockToggle(user, isBlocked)}
                                                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${isBlocked ? "text-slate-700" : "text-rose-600"}`}
                                            >
                                                {isBlocked ? "Unblock" : "Block"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
