/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Edit,
  MessageCircle,
  Plus,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { deletePost, getAllPosts } from "../api/api";

import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";

export default function Explore() {
  const [posts, setPosts] = useState<any[]>([]);
  const [error, setError] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  console.log(currentUser);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("You must be logged in to view posts.");
        }
        const data: any = await getAllPosts();
        console.log(data);
        setPosts(data);
      } catch (err: any) {
        console.log(err);
        setError(err.message || "Failed to fetch posts.");
      }
    };

    fetchPosts();
  }, []);

  const handleDelete = async (postId: string) => {
    const result = await Swal.fire({
      title: "Delete this post?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e53935",
      cancelButtonColor: "#3085d6",
    });

    if (result.isConfirmed) {
      try {
        await deletePost(postId);
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        Swal.fire("Deleted!", "Your post has been removed.", "success");
      } catch (err: any) {
        Swal.fire("Error", err.message || "Failed to delete post", "error");
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <h1 className="text-2xl text-red-600 font-semibold mb-4">Error</h1>
        <p className="text-gray-700">{error}</p>
        <Link href="/login" className="mt-4 text-primary underline">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-8">
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold text-primary">Explore</h1>
          <p className="mt-2 text-base text-gray-600">
            Discover new topics and interests
          </p>
        </div>

        <Link
          href="/create"
          className="mt-4 md:mt-0 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 text-sm"
        >
          <Plus size={16} />
          Create Post
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        {posts.map((post: any) => (
          <Link
            key={post._id}
            href={`/explore/post/${post._id}`}
            className="border border-gray-200 rounded-md bg-white hover:shadow-sm transition duration-200"
          >
            <Image
              src={post.image || "/Placeholder.png"}
              alt={post.title}
              width={400}
              height={250}
              className="w-full h-48 object-cover border-b"
            />
            <div className="p-4">
              <span className="text-xs text-secondary font-medium uppercase tracking-wide">
                {post.category}
              </span>
              <h2 className="text-lg font-semibold text-primary mt-1">{post.title}</h2>
              <p className="mt-2 text-sm text-gray-600 line-clamp-3">{post.content}</p>

              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <Image
                  src={post.author?.profilePic || "/DefaultAvatar.png"}
                  alt={post.author?.name || "User"}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
                <span>{post.author?.name || "Unknown"}</span>
                <span className="ml-auto text-xs">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              <div className="mt-3 flex justify-between text-gray-500 text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="text-primary" size={14} />
                    <span>{post.likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="text-primary" size={14} />
                    <span>{post.comments?.length || 0}</span>
                  </div>
                </div>
                {post.author?._id === currentUser?._id && (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/explore/post/${post._id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary hover:underline text-xs flex items-center gap-1"
                    >
                      <Edit size={14} />
                      <span className="hidden sm:inline">Edit</span>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(post._id);
                      }}
                      className="text-red-500 hover:underline text-xs flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
