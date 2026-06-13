"use client";

import { ApiError, blockUser, followUser, getMe, muteUser, searchUsers, unblockUser, unfollowUser, unmuteUser } from "@/app/api/api";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";

import { IUser } from "@/app/types/user";
import { Flag, MoreHorizontal, Search, UsersRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Avatar from "react-avatar";
import Swal from "sweetalert2";
import ReportModal from "@/components/features/ReportModal";

function UserSearchContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams?.get("query") || "";
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<IUser[]>([]);
    const [followingIds, setFollowingIds] = useState<string[]>([]);
    const [requestedIds, setRequestedIds] = useState<string[]>([]);
    const [blockedIds, setBlockedIds] = useState<string[]>([]);
    const [mutedIds, setMutedIds] = useState<string[]>([]);
    const [currentUserId, setCurrentUserId] = useState("");
    const [actionMenuUserId, setActionMenuUserId] = useState<string | null>(null);
    const [reportUser, setReportUser] = useState<IUser | null>(null);
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
                const initialUsers = await searchUsers(initialQuery) as IUser[];
                setResults(initialUsers);
                setRequestedIds(initialUsers.filter((user) => user.hasRequestedFollow).map((user) => user._id));
            } catch {
                // Do not show a search failure until the user explicitly searches.
            }
        };
        void fetchInitial();
    }, [initialQuery]);

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
            setRequestedIds(users.filter((user) => user.hasRequestedFollow).map((user) => user._id));
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
                const response = await followUser(userId);
                if (response?.status === "requested") {
                    setRequestedIds((prev) => [...new Set([...prev, userId])]);
                } else {
                    setFollowingIds((prev) => [...new Set([...prev, userId])]);
                    setRequestedIds((prev) => prev.filter((id) => id !== userId));
                }
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
                    const isRequested = requestedIds.includes(user._id);
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
                                    <Link href={`/users/${user._id}`} className="font-semibold text-slate-900 hover:text-indigo-700">{user.name}</Link>
                                    {user.canViewProfile !== false && user.bio && (
                                        <p className="text-sm text-gray-600">{user.bio}</p>
                                    )}
                                    {user.canViewProfile !== false && user.interests?.length > 0 && (
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
                                            disabled={isRequested}
                                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${isFollowing
                                                ? "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                                                : isRequested
                                                    ? "bg-slate-100 text-slate-500"
                                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                                                }`}
                                        >
                                            {isFollowing ? "Unfollow" : isRequested ? "Requested" : "Follow"}
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
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActionMenuUserId(null);
                                                    setReportUser(user);
                                                }}
                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                                            >
                                                <Flag size={14} /> Report
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {reportUser && (
                <ReportModal
                    targetType="user"
                    targetId={reportUser._id}
                    targetLabel={reportUser.name}
                    onClose={() => setReportUser(null)}
                />
            )}
        </div>
    );
}

export default function UserSearchPage() {
    return (
        <Suspense fallback={<div className="surface shell-container p-10 text-center text-slate-500">Loading people...</div>}>
            <UserSearchContent />
        </Suspense>
    );
}

