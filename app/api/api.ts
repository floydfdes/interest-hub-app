/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4300/api";

function startLoader() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("loader:start"));
    }
}

function stopLoader() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("loader:stop"));
    }
}

const request = async <T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    endpoint: string,
    options: {
        body?: any;
        queryParams?: Record<string, any>;
    } = {}
): Promise<T> => {
    startLoader();
    try {
        const { body, queryParams } = options;
        const url = new URL(`${API_BASE}${endpoint}`);

        if (queryParams) {
            Object.entries(queryParams).forEach(([key, value]) =>
                url.searchParams.append(key, String(value))
            );
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        headers["x-requested-with"] = "InterestHubFrontend";


        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(url.toString(), {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) throw new Error((await res.json()).message || "Request failed");
        return await res.json();
    } finally {
        stopLoader();
    }
};

// Auth
export const registerUser = (data: any) => request("POST", "/auth/register", { body: data });
export const loginUser = (data: any) => request("POST", "/auth/login", { body: data });
export const refreshToken = () => request("POST", "/auth/refresh");
export const logoutUser = () => request("POST", "/auth/logout");
export const changePassword = (data: any) =>
    request("PATCH", "/auth/change-password", { body: data });
export const forgotPassword = (email: string) =>
    request("POST", "/auth/forgot-password", { body: { email } });
export const resetPassword = (data: any) =>
    request("POST", "/auth/reset-password", { body: data });

// Posts
export const getAllPosts = () => request("GET", "/posts");
export const getPostById = (id: string) => request("GET", `/posts/${id}`);
export const createPost = (data: any) => request("POST", "/posts", { body: data });
export const updatePost = (id: string, data: any) =>
    request("PUT", `/posts/${id}`, { body: data });
export const deletePost = (id: string) => request("DELETE", `/posts/${id}`);

// Users
export const getMe = () => request("GET", "/users/me");
export const getUserProfile = (id: string) => request("GET", `/users/${id}`);
export const updateUser = (data: any) => request("PATCH", "/users/update", { body: data });
export const deleteUser = () => request("DELETE", "/users/delete");
export const followUser = (id: string) => request("POST", `/users/follow/${id}`);
export const unfollowUser = (id: string) => request("POST", `/users/unfollow/${id}`);
export const getFollowers = (id: string) => request("GET", `/users/${id}/followers`);
export const getFollowing = (id: string) => request("GET", `/users/${id}/following`);
export const blockUser = (id: string) => request("POST", `/users/block/${id}`);
export const unblockUser = (id: string) => request("POST", `/users/unblock/${id}`);
export const searchUsers = (query: string) =>
    request("GET", `/users/search`, { queryParams: { q: query } });

// Comments
export const createComment = (postId: string, content: string) =>
    request("POST", "/comments", { body: { postId, content } });

export const editComment = (commentId: string, content: string) =>
    request("PATCH", `/comments/${commentId}`, { body: { content } });

export const deleteComment = (commentId: string) =>
    request("DELETE", `/comments/${commentId}`);

export const likeComment = (commentId: string) =>
    request("POST", `/comments/${commentId}/like`);

export const unlikeComment = (commentId: string) =>
    request("POST", `/comments/${commentId}/unlike`);

export const replyToComment = (commentId: string, content: string) =>
    request("POST", `/comments/${commentId}/reply`, { body: { content } });

export const editReply = (commentId: string, replyIndex: number, content: string) =>
    request("PATCH", `/comments/${commentId}/reply/${replyIndex}`, { body: { content } });

export const deleteReply = (commentId: string, replyIndex: number) =>
    request("DELETE", `/comments/${commentId}/reply/${replyIndex}`);

export const likeReply = (commentId: string, replyIndex: number) =>
    request("POST", `/comments/${commentId}/reply/${replyIndex}/like`);

export const unlikeReply = (commentId: string, replyIndex: number) =>
    request("POST", `/comments/${commentId}/reply/${replyIndex}/unlike`);

export const replyToReply = (commentId: string, parentReplyIndex: number, content: string) =>
    request("POST", `/comments/${commentId}/reply/${parentReplyIndex}/reply`, { body: { content } });
