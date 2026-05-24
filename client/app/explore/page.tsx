"use client";

import { Edit, Flame, LayoutGrid, List, MessageCircle, PenLine, RotateCcw, Search, SlidersHorizontal, Sparkles, ThumbsUp, Trash2, UsersRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { advancedSearchPosts, deletePost, getBookmarkedPosts, getErrorMessage, getFollowingPosts, getRecommendedPosts, getTrendingPosts, PostAdvancedSearchFilters, searchPosts, TrendingPeriod } from "../api/api";
import { IPost } from "../types/user";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";
import { useCurrentUser } from "../hooks/useCurrentUser";
import BookmarkButton from "@/components/features/BookmarkButton";
import SuggestedUsers from "@/components/features/SuggestedUsers";

type ViewMode = "cards" | "list";
type SearchMode = "quick" | "advanced";
type DiscoveryFeed = "recommended" | "following" | "trending";

async function fetchDiscoveryPosts(feed: DiscoveryFeed, period: TrendingPeriod) {
  if (feed === "recommended") return getRecommendedPosts();
  if (feed === "following") return getFollowingPosts();
  return getTrendingPosts(period);
}

export default function Explore() {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchMode, setSearchMode] = useState<SearchMode>("quick");
  const [feed, setFeed] = useState<DiscoveryFeed>("trending");
  const [trendingPeriod, setTrendingPeriod] = useState<TrendingPeriod>("week");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [quickQuery, setQuickQuery] = useState("");
  const [filters, setFilters] = useState<PostAdvancedSearchFilters>({});
  const [searching, setSearching] = useState(true);
  const [searchError, setSearchError] = useState("");
  const [resultLabel, setResultLabel] = useState("");
  const currentUser = useCurrentUser();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const hasToken = Boolean(localStorage.getItem("token"));
        const [nextPosts, bookmarks] = await Promise.all([
          getTrendingPosts("week"),
          hasToken ? getBookmarkedPosts().catch(() => []) : Promise.resolve([]),
        ]);
        const nextBookmarkedIds = new Set(bookmarks.map((post) => post._id));
        setBookmarkedIds(nextBookmarkedIds);
        setPosts(nextPosts.map((post) => ({ ...post, isBookmarked: nextBookmarkedIds.has(post._id) || post.isBookmarked })));
      } catch (err: unknown) {
        setSearchError(getErrorMessage(err, "Failed to fetch posts."));
      } finally {
        setSearching(false);
      }
    };

    void fetchPosts();
  }, []);

  const loadDiscoveryFeed = async (nextFeed: DiscoveryFeed, period: TrendingPeriod) => {
    setFeed(nextFeed);
    setTrendingPeriod(period);
    setResultLabel("");
    setSearching(true);
    setSearchError("");

    if (nextFeed !== "trending" && !localStorage.getItem("token")) {
      setPosts([]);
      setSearchError("Log in to view personalized discovery posts.");
      setSearching(false);
      return;
    }

    try {
      const nextPosts = await fetchDiscoveryPosts(nextFeed, period);
      setPosts(nextPosts.map((post) => ({
        ...post,
        isBookmarked: bookmarkedIds.has(post._id) || post.isBookmarked,
      })));
    } catch (err: unknown) {
      setPosts([]);
      setSearchError(getErrorMessage(err, "Failed to fetch posts."));
    } finally {
      setSearching(false);
    }
  };

  const setBookmarkState = (postId: string, bookmarked: boolean) => {
    setBookmarkedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (bookmarked) nextIds.add(postId);
      else nextIds.delete(postId);
      return nextIds;
    });
    setPosts((currentPosts) => currentPosts.map((post) => (
      post._id === postId ? { ...post, isBookmarked: bookmarked } : post
    )));
  };

  const handleQuickSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = quickQuery.trim();
    if (!query) {
      setSearchError("Enter a keyword to search posts.");
      return;
    }

    setSearching(true);
    setSearchError("");
    try {
      const nextPosts = await searchPosts(query);
      setPosts(nextPosts.map((post) => ({ ...post, isBookmarked: bookmarkedIds.has(post._id) || post.isBookmarked })));
      setResultLabel(`Results for "${query}"`);
    } catch (err: unknown) {
      setSearchError(getErrorMessage(err, "Failed to search posts."));
    } finally {
      setSearching(false);
    }
  };

  const handleAdvancedSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearching(true);
    setSearchError("");
    try {
      const nextPosts = await advancedSearchPosts(filters);
      setPosts(nextPosts.map((post) => ({ ...post, isBookmarked: bookmarkedIds.has(post._id) || post.isBookmarked })));
      setResultLabel("Advanced search results");
    } catch (err: unknown) {
      setSearchError(getErrorMessage(err, "Failed to search posts."));
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = async () => {
    setQuickQuery("");
    setFilters({});
    setSearchError("");
    await loadDiscoveryFeed(feed, trendingPeriod);
  };

  const handleSearchModeChange = async (nextMode: SearchMode) => {
    if (nextMode === searchMode) return;

    setSearchMode(nextMode);
    setQuickQuery("");
    setFilters({});
    setSearchError("");
    await loadDiscoveryFeed(feed, trendingPeriod);
  };

  const updateFilter = (name: keyof PostAdvancedSearchFilters, value: string) => {
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const handleDelete = async (postId: string) => {
    const result = await Swal.fire({
      title: "Delete this post?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete post",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#4f46e5",
    });

    if (result.isConfirmed) {
      try {
        await deletePost(postId);
        setPosts((previous) => previous.filter((post) => post._id !== postId));
        void Swal.fire("Deleted", "Your post has been removed.", "success");
      } catch (err: unknown) {
        void Swal.fire("Error", getErrorMessage(err, "Failed to delete post"), "error");
      }
    }
  };

  return (
    <div className="shell-container">
      <header className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <span className="eyebrow"><Sparkles size={12} /> Discover</span>
          <h1 className="gradient-heading mt-4 text-4xl font-bold">Explore interests</h1>
          <p className="mt-2 text-base text-slate-500">Find posts, ideas, and people worth following.</p>
        </div>
        <Link href="/create-post" className="primary-button">
          <PenLine size={16} />
          Create post
        </Link>
      </header>

      <section className="surface mb-7 p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2" aria-label="Discovery feed">
            <button
              type="button"
              onClick={() => void loadDiscoveryFeed("trending", trendingPeriod)}
              aria-pressed={feed === "trending"}
              className={`secondary-button !min-h-0 !py-2 ${feed === "trending" ? "!border-indigo-200 !bg-indigo-50 !text-indigo-700" : ""}`}
            >
              <Flame size={15} /> Trending
            </button>
            <button
              type="button"
              onClick={() => void loadDiscoveryFeed("recommended", trendingPeriod)}
              aria-pressed={feed === "recommended"}
              className={`secondary-button !min-h-0 !py-2 ${feed === "recommended" ? "!border-indigo-200 !bg-indigo-50 !text-indigo-700" : ""}`}
            >
              <Sparkles size={15} /> Recommended
            </button>
            <button
              type="button"
              onClick={() => void loadDiscoveryFeed("following", trendingPeriod)}
              aria-pressed={feed === "following"}
              className={`secondary-button !min-h-0 !py-2 ${feed === "following" ? "!border-indigo-200 !bg-indigo-50 !text-indigo-700" : ""}`}
            >
              <UsersRound size={15} /> Following
            </button>
          </div>
          {feed === "trending" && (
            <select
              aria-label="Trending period"
              value={trendingPeriod}
              onChange={(event) => void loadDiscoveryFeed("trending", event.target.value as TrendingPeriod)}
              className="soft-input px-4 text-sm text-slate-600 outline-none"
            >
              <option value="day">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="all">All time</option>
            </select>
          )}
        </div>
      </section>

      <SuggestedUsers authenticated={Boolean(currentUser)} />

      <section className="surface mb-7 p-4 sm:p-5">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="Search type">
            <button
              type="button"
              data-testid="quick-search-mode"
              onClick={() => void handleSearchModeChange("quick")}
              aria-pressed={searchMode === "quick"}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                searchMode === "quick" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"
              }`}
            >
              <Search size={16} />
              Quick
            </button>
            <button
              type="button"
              data-testid="advanced-search-mode"
              onClick={() => void handleSearchModeChange("advanced")}
              aria-pressed={searchMode === "advanced"}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                searchMode === "advanced" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"
              }`}
            >
              <SlidersHorizontal size={16} />
              Advanced
            </button>
          </div>
          <button type="button" onClick={() => void handleClearSearch()} className="secondary-button" disabled={searching}>
            <RotateCcw size={15} />
            Clear results
          </button>
        </div>

        {searchMode === "quick" ? (
          <form onSubmit={handleQuickSearch} className="flex min-w-0 flex-col gap-3 sm:flex-row">
            <input
              data-testid="post-search-input"
              value={quickQuery}
              onChange={(event) => setQuickQuery(event.target.value)}
              placeholder="Search title, content, category, or tags..."
              className="soft-input min-w-0 flex-1 px-4 text-sm outline-none"
            />
            <button data-testid="post-search-submit" type="submit" className="primary-button" disabled={searching}>
              <Search size={16} />
              Search
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdvancedSearch}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                data-testid="advanced-search-title"
                value={filters.title || ""}
                onChange={(event) => updateFilter("title", event.target.value)}
                placeholder="Title contains"
                className="soft-input px-4 text-sm outline-none"
              />
              <input
                data-testid="advanced-search-content"
                value={filters.content || ""}
                onChange={(event) => updateFilter("content", event.target.value)}
                placeholder="Content contains"
                className="soft-input px-4 text-sm outline-none"
              />
              <input
                data-testid="advanced-search-category"
                value={filters.category || ""}
                onChange={(event) => updateFilter("category", event.target.value)}
                placeholder="Category"
                className="soft-input px-4 text-sm outline-none"
              />
              <input
                data-testid="advanced-search-tags"
                value={filters.tags || ""}
                onChange={(event) => updateFilter("tags", event.target.value)}
                placeholder="Tags, comma separated"
                className="soft-input px-4 text-sm outline-none"
              />
            </div>
            <p className="mt-3 text-xs text-slate-400">When multiple tags are entered, posts must match all of them.</p>
            <button data-testid="advanced-search-submit" type="submit" className="primary-button mt-4" disabled={searching}>
              <Search size={16} />
              Apply filters
            </button>
          </form>
        )}

        {searchError && <p className="mt-4 text-sm font-medium text-rose-600">{searchError}</p>}
      </section>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          {resultLabel && <p className="text-sm font-semibold text-slate-700">{resultLabel}</p>}
          <p className="text-sm font-medium text-slate-500">
            {searching ? "Searching..." : `${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
          </p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Post view">
          <button
            type="button"
            data-testid="cards-view-toggle"
            aria-pressed={viewMode === "cards"}
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              viewMode === "cards"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutGrid size={16} />
            Cards
          </button>
          <button
            type="button"
            data-testid="list-view-toggle"
            aria-pressed={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              viewMode === "list"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <List size={16} />
            List
          </button>
        </div>
      </div>

      {!searching && posts.length === 0 && (
        <div className="surface px-6 py-14 text-center text-slate-500">
          {resultLabel ? "No posts matched your search." : "No posts available in this feed yet."}
          {searchError.includes("Log in") && <div><Link href="/login" className="primary-button mt-5">Log in to continue</Link></div>}
        </div>
      )}

      <div className={viewMode === "cards" ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
        {posts.map((post) => (
          <article
            key={post._id}
            className={`surface overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_48px_-27px_rgba(15,23,42,0.32)] ${
              viewMode === "list" ? "p-4 sm:p-5" : ""
            }`}
          >
            <Link href={`/posts/${post._id}`} className={viewMode === "cards" ? "block" : "flex flex-col gap-4 sm:flex-row"}>
              <Image
                src={post.image || "/default_image.png"}
                alt={post.title}
                width={480}
                height={300}
                unoptimized={post.image?.startsWith("data:")}
                className={viewMode === "cards" ? "h-52 w-full object-cover" : "h-40 w-full shrink-0 rounded-2xl object-cover sm:w-56"}
              />
              <div className={viewMode === "cards" ? "p-5" : "min-w-0 flex-1 py-1"}>
                <span className="tag-pill">{post.category}</span>
                <h2 className={`${viewMode === "cards" ? "mt-4" : "mt-3"} text-xl font-semibold tracking-tight text-slate-900`}>{post.title}</h2>
                <p className={`mt-2 text-sm leading-6 text-slate-500 ${viewMode === "cards" ? "line-clamp-2" : "line-clamp-3"}`}>{post.content}</p>
                <div className={`${viewMode === "cards" ? "mt-5" : "mt-4"} flex items-center gap-2 text-sm text-slate-500`}>
                  <Image
                    src={post.author?.profilePic || "/DefaultAvatar.png"}
                    alt={post.author?.name || "User"}
                    width={30}
                    height={30}
                    className="rounded-full"
                  />
                  <span className="font-medium text-slate-700">{post.author?.name || "Unknown"}</span>
                  <span className="ml-auto text-xs">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </Link>
            <div className={`flex items-center justify-between border-t border-slate-100 text-sm text-slate-500 ${viewMode === "cards" ? "px-5 py-3" : "mt-4 pt-4"}`}>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><ThumbsUp size={14} />{post.likes?.length || 0}</span>
                <span className="flex items-center gap-1.5"><MessageCircle size={14} />{post.comments?.length || 0}</span>
                <BookmarkButton
                  postId={post._id}
                  currentUser={currentUser}
                  initialBookmarked={post.isBookmarked}
                  onBookmarkChange={setBookmarkState}
                />
              </div>
              {post.author?._id === currentUser?._id && (
                <div className="flex items-center gap-3">
                  <Link data-testid="post-edit-link" href={`/explore/post/${post._id}/edit`} className="text-indigo-600 transition hover:text-indigo-800">
                    <Edit size={15} />
                  </Link>
                  <button data-testid="post-delete-button" onClick={() => void handleDelete(post._id)} className="text-rose-500 transition hover:text-rose-700">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
