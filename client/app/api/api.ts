import {
    AuthResponse,
    IComment,
    IPost,
    IUser,
    LoginInput,
    PostInput,
    PostUpdateInput,
    ProfileUpdateInput,
    RegisterInput,
    UserResponse,
} from "@/app/types/user";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4300/api";

type QueryValue = string | number | boolean;
type RequestBody = Record<string, unknown>;

interface RequestOptions {
    body?: RequestBody;
    queryParams?: Record<string, QueryValue>;
}

export interface PostAdvancedSearchFilters {
    title?: string;
    content?: string;
    category?: string;
    tags?: string;
}

export type TrendingPeriod = "day" | "week" | "month" | "all";

export interface MessageResponse {
    message: string;
}

type RawAuthResponse = Omit<AuthResponse, "user"> & {
    user: IUser & { id?: string };
};

function normalizeAuthResponse(response: RawAuthResponse): AuthResponse {
    return {
        ...response,
        user: {
            ...response.user,
            _id: response.user._id || response.user.id || "",
        },
    };
}

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

export function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
}

const request = async <T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> => {
    startLoader();
    try {
        const url = new URL(`${API_BASE}${endpoint}`);
        Object.entries(options.queryParams || {}).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "x-requested-with": "InterestHubFrontend",
        };
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(url.toString(), {
            method,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({})) as { message?: string };
            throw new Error(data.message || "Request failed");
        }

        if (response.status === 204) return undefined as T;
        return await response.json() as T;
    } finally {
        stopLoader();
    }
};

// Auth
export const registerUser = async (data: RegisterInput) =>
    normalizeAuthResponse(await request<RawAuthResponse>("POST", "/auth/register", { body: { ...data } }));
export const loginUser = async (data: LoginInput) =>
    normalizeAuthResponse(await request<RawAuthResponse>("POST", "/auth/login", { body: { ...data } }));
export const refreshToken = () => request<AuthResponse>("POST", "/auth/refresh");
export const logoutUser = () => request<void>("POST", "/auth/logout");
export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
    request<void>("PATCH", "/auth/change-password", { body: { ...data } });
export const forgotPassword = (email: string) =>
    request<void>("POST", "/auth/forgot-password", { body: { email } });
export const resetPassword = (data: { token: string; newPassword: string }) =>
    request<void>("POST", "/auth/reset-password", { body: { ...data } });

// Posts
export const getAllPosts = () => request<IPost[]>("GET", "/posts");
export const searchPosts = (query: string) =>
    request<IPost[]>("GET", "/posts/search", { queryParams: { query } });
export const advancedSearchPosts = (filters: PostAdvancedSearchFilters) => {
    const queryParams = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value?.trim())
    ) as Record<string, QueryValue>;

    return request<IPost[]>("GET", "/posts/advanced-search", { queryParams });
};
export const getPostById = (id: string) => request<IPost>("GET", `/posts/${id}`);
export const createPost = (data: PostInput) =>
    request<IPost>("POST", "/posts", { body: { ...data } });
export const updatePost = (id: string, data: PostUpdateInput) =>
    request<IPost>("PUT", `/posts/${id}`, { body: { ...data } });
export const deletePost = (id: string) => request<void>("DELETE", `/posts/${id}`);
export const likePost = (id: string) => request<Pick<IPost, "likes">>("POST", `/posts/${id}/like`);
export const unlikePost = (id: string) => request<Pick<IPost, "likes">>("POST", `/posts/${id}/unlike`);
export const getFollowingPosts = (limit = 20) =>
    request<IPost[]>("GET", "/posts/following", { queryParams: { limit } });
export const getTrendingPosts = (period: TrendingPeriod = "week", limit = 20) =>
    request<IPost[]>("GET", "/posts/trending", { queryParams: { period, limit } });
export const getRecommendedPosts = (limit = 20) =>
    request<IPost[]>("GET", "/posts/recommended", { queryParams: { limit } });
export const getBookmarkedPosts = () => request<IPost[]>("GET", "/posts/bookmarks");
export const bookmarkPost = (id: string) => request<MessageResponse>("POST", `/posts/${id}/bookmark`);
export const removeBookmark = (id: string) => request<MessageResponse>("DELETE", `/posts/${id}/bookmark`);

// Users
export const getMe = () => request<UserResponse>("GET", "/users/me");
export const getUserProfile = (id: string) => request<IUser>("GET", `/users/${id}`);
export const updateUser = (data: ProfileUpdateInput) =>
    request<UserResponse>("PATCH", "/users/update", { body: { ...data } });
export const deleteUser = () => request<void>("DELETE", "/users/delete");
export const followUser = (id: string) => request<void>("POST", `/users/follow/${id}`);
export const unfollowUser = (id: string) => request<void>("POST", `/users/unfollow/${id}`);
export const getFollowers = (id: string) => request<IUser[]>("GET", `/users/${id}/followers`);
export const getFollowing = (id: string) => request<IUser[]>("GET", `/users/${id}/following`);
export const blockUser = (id: string) => request<void>("POST", `/users/block/${id}`);
export const unblockUser = (id: string) => request<void>("POST", `/users/unblock/${id}`);
export const searchUsers = (query: string) =>
    request<IUser[]>("GET", "/users/search", { queryParams: { query } });
export const getSuggestedUsers = (limit = 10) =>
    request<IUser[]>("GET", "/users/suggested", { queryParams: { limit } });

// Comments
export const createComment = (postId: string, content: string) =>
    request<void>("POST", "/comments", { body: { postId, content } });
export const editComment = (commentId: string, content: string) =>
    request<void>("PATCH", `/comments/${commentId}`, { body: { content } });
export const deleteComment = (commentId: string) =>
    request<void>("DELETE", `/comments/${commentId}`);
export const likeComment = (commentId: string) =>
    request<Pick<IComment, "likes">>("POST", `/comments/${commentId}/like`);
export const unlikeComment = (commentId: string) =>
    request<Pick<IComment, "likes">>("POST", `/comments/${commentId}/unlike`);
export const replyToComment = (commentId: string, content: string) =>
    request<void>("POST", `/comments/${commentId}/reply`, { body: { content } });
export const editReply = (commentId: string, replyIndex: number, content: string) =>
    request<void>("PATCH", `/comments/${commentId}/reply/${replyIndex}`, { body: { content } });
export const deleteReply = (commentId: string, replyIndex: number) =>
    request<void>("DELETE", `/comments/${commentId}/reply/${replyIndex}`);
export const likeReply = (commentId: string, replyIndex: number) =>
    request<void>("POST", `/comments/${commentId}/reply/${replyIndex}/like`);
export const unlikeReply = (commentId: string, replyIndex: number) =>
    request<void>("POST", `/comments/${commentId}/reply/${replyIndex}/unlike`);
export const replyToReply = (commentId: string, parentReplyIndex: number, content: string) =>
    request<void>("POST", `/comments/${commentId}/reply/${parentReplyIndex}/reply`, { body: { content } });
