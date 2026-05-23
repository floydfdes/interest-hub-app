"use client";

import { Edit, MessageCircle, PenLine, Sparkles, ThumbsUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { deletePost, getAllPosts, getErrorMessage } from "../api/api";
import { IPost } from "../types/user";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function Explore() {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [error, setError] = useState("");
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post._id}
            className="surface overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_48px_-27px_rgba(15,23,42,0.32)]"
          >
            <Link href={`/explore/post/${post._id}`} className="block">
              <Image
                src={post.image || "/Placeholder.png"}
                alt={post.title}
                width={480}
                height={300}
                unoptimized={post.image?.startsWith("data:")}
                className="h-52 w-full object-cover"
              />
              <div className="p-5">
                <span className="tag-pill">{post.category}</span>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">{post.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{post.content}</p>
                <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
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
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><ThumbsUp size={14} />{post.likes?.length || 0}</span>
                <span className="flex items-center gap-1.5"><MessageCircle size={14} />{post.comments?.length || 0}</span>
              </div>
              {post.author?._id === currentUser?._id && (
                <div className="flex items-center gap-3">
                  <Link href={`/explore/post/${post._id}/edit`} className="text-indigo-600 transition hover:text-indigo-800">
                    <Edit size={15} />
                  </Link>
                  <button onClick={() => void handleDelete(post._id)} className="text-rose-500 transition hover:text-rose-700">
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
