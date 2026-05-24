"use client";

import { Edit, LayoutGrid, List, MessageCircle, PenLine, Sparkles, ThumbsUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { deletePost, getAllPosts, getErrorMessage } from "../api/api";
import { IPost } from "../types/user";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";
import { useCurrentUser } from "../hooks/useCurrentUser";

type ViewMode = "cards" | "list";

export default function Explore() {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const currentUser = useCurrentUser();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        if (!localStorage.getItem("token")) {
          throw new Error("You must be logged in to view posts.");
        }
        setPosts(await getAllPosts());
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to fetch posts."));
      }
    };

    void fetchPosts();
  }, []);

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

  if (error) {
    return (
      <div className="surface shell-container max-w-lg p-10 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Ready to explore?</h1>
        <p className="mt-3 text-slate-500">{error}</p>
        <Link href="/login" className="primary-button mt-7">Log in to continue</Link>
      </div>
    );
  }

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

      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-500">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
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
