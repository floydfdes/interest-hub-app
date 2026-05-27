import {
    ActivityType,
    AdminActivitiesResponse,
    AdminDashboardResponse,
    AdminBulkCreatePostsResponse,
    AdminBulkCreateUsersResponse,
    AdminBulkPostInput,
    AdminBulkUserInput,
    AdminPostsResponse,
    AdminReportsResponse,
    AdminUserDetailResponse,
    AdminUserInput,
    AdminUserUpdateInput,
    AdminUsersResponse,
    ArchivedPostsResponse,
    AuthResponse,
    BasicUserSummary,
    IComment,
    IPost,
    IUser,
    LoginInput,
    MutedUsersResponse,
    MyActivitiesResponse,
    MyReportsResponse,
    PaginatedResponse,
    PostInput,
    PostUpdateInput,
    ProfileUpdateInput,
    PublicUserProfile,
    RegisterInput,
    ReportAction,
    ReportInput,
    ReportStatus,
    ReportTargetType,
    UserReport,
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

export interface FollowResponse extends MessageResponse {
    status: "followed" | "requested" | "existing";
}

export interface ArchivedPostResponse extends MessageResponse {
    post: Pick<IPost, "_id" | "isArchived" | "archivedAt">;
}

export interface BulkDeleteResponse extends MessageResponse {
    requested: number;
    deleted: number;
}

export interface AdminActivityFilters {
    page?: number;
    limit?: number;
    type?: ActivityType;
    actorId?: string;
}

export interface MyActivityFilters {
    page?: number;
    limit?: number;
    type?: ActivityType;
}

export interface AdminReportFilters {
    page?: number;
    limit?: number;
    status?: ReportStatus;
    targetType?: ReportTargetType;
}

type RawMutedUsersResponse = {
    data: BasicUserSummary[];
    pagination: Omit<MutedUsersResponse["pagination"], "hasPreviousPage"> & {
        hasPrevPage: boolean;
    };
};

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
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
            throw new ApiError(data.message || "Request failed", response.status);
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
export const getAllPosts = (page = 1, limit = 20) =>
    request<PaginatedResponse<IPost>>("GET", "/posts", { queryParams: { page, limit } });
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
export const getPostLikes = (id: string, page = 1, limit = 20) =>
    request<PaginatedResponse<IUser>>("GET", `/posts/${id}/likes`, { queryParams: { page, limit } });
export const getFollowingPosts = (page = 1, limit = 20) =>
    request<PaginatedResponse<IPost>>("GET", "/posts/following", { queryParams: { page, limit } });
export const getTrendingPosts = (period: TrendingPeriod = "week", limit = 20) =>
    request<IPost[]>("GET", "/posts/trending", { queryParams: { period, limit } });
export const getRecommendedPosts = (limit = 20) =>
    request<IPost[]>("GET", "/posts/recommended", { queryParams: { limit } });
export const getBookmarkedPosts = () => request<IPost[]>("GET", "/posts/bookmarks");
export const bookmarkPost = (id: string) => request<MessageResponse>("POST", `/posts/${id}/bookmark`);
export const removeBookmark = (id: string) => request<MessageResponse>("DELETE", `/posts/${id}/bookmark`);
export const hidePost = (id: string) => request<MessageResponse>("POST", `/posts/${id}/hide`);
export const unhidePost = (id: string) => request<MessageResponse>("DELETE", `/posts/${id}/hide`);
export const getHiddenPosts = (page = 1, limit = 20) =>
    request<PaginatedResponse<IPost>>("GET", "/posts/hidden", { queryParams: { page, limit } });
export const archivePost = (id: string) => request<ArchivedPostResponse>("PATCH", `/posts/${id}/archive`);
export const unarchivePost = (id: string) => request<ArchivedPostResponse>("PATCH", `/posts/${id}/unarchive`);
export const getArchivedPosts = (page = 1, limit = 20) =>
    request<ArchivedPostsResponse>("GET", "/posts/archived", { queryParams: { page, limit } });

// Users
export const getMe = () => request<UserResponse>("GET", "/users/me");
export const getUserProfile = (id: string) => request<PublicUserProfile>("GET", `/users/profile/${id}`);
export const updateUser = (data: ProfileUpdateInput) =>
    request<UserResponse>("PATCH", "/users/update", { body: { ...data } });
export const deleteUser = () => request<void>("DELETE", "/users/delete");
export const followUser = (id: string) => request<FollowResponse>("POST", `/users/follow/${id}`);
export const unfollowUser = (id: string) => request<void>("POST", `/users/unfollow/${id}`);
export const getFollowers = (id: string, page = 1, limit = 20) =>
    request<PaginatedResponse<IUser>>("GET", `/users/${id}/followers`, { queryParams: { page, limit } });
export const getFollowing = (id: string, page = 1, limit = 20) =>
    request<PaginatedResponse<IUser>>("GET", `/users/${id}/following`, { queryParams: { page, limit } });
export const blockUser = (id: string) => request<MessageResponse>("POST", `/users/block/${id}`);
export const unblockUser = (id: string) => request<MessageResponse>("POST", `/users/unblock/${id}`);
export const getBlockedUsers = (page = 1, limit = 20) =>
    request<PaginatedResponse<BasicUserSummary>>("GET", "/users/blocked", { queryParams: { page, limit } });
export const muteUser = (id: string) => request<MessageResponse>("POST", `/users/mute/${id}`);
export const unmuteUser = (id: string) => request<MessageResponse>("POST", `/users/unmute/${id}`);
export const getMutedUsers = async (page = 1, limit = 20): Promise<MutedUsersResponse> => {
    const response = await request<RawMutedUsersResponse>("GET", "/users/muted", { queryParams: { page, limit } });
    return {
        items: response.data,
        pagination: {
            page: response.pagination.page,
            limit: response.pagination.limit,
            total: response.pagination.total,
            totalPages: response.pagination.totalPages,
            hasNextPage: response.pagination.hasNextPage,
            hasPreviousPage: response.pagination.hasPrevPage,
        },
    };
};
export const getFollowRequests = (page = 1, limit = 20) =>
    request<PaginatedResponse<BasicUserSummary>>("GET", "/users/follow-requests", { queryParams: { page, limit } });
export const acceptFollowRequest = (id: string) =>
    request<MessageResponse>("POST", `/users/follow-requests/${id}/accept`);
export const rejectFollowRequest = (id: string) =>
    request<MessageResponse>("POST", `/users/follow-requests/${id}/reject`);
export const searchUsers = (query: string) =>
    request<IUser[]>("GET", "/users/search", { queryParams: { query } });
export const getSuggestedUsers = (limit = 10) =>
    request<IUser[]>("GET", "/users/suggested", { queryParams: { limit } });
export const getMyActivities = ({
    page = 1,
    limit = 20,
    type,
}: MyActivityFilters = {}) => {
    const queryParams: Record<string, QueryValue> = { page, limit };
    if (type) queryParams.type = type;

    return request<MyActivitiesResponse>("GET", "/users/activities", { queryParams });
};

// Reports
export const submitReport = (data: ReportInput) =>
    request<UserReport>("POST", "/reports", { body: { ...data } });
export const getMyReports = (page = 1, limit = 20) =>
    request<MyReportsResponse>("GET", "/reports/me", { queryParams: { page, limit } });

// Admin
export const checkAdminAccess = () => request<{ isAdmin: true }>("GET", "/admin/access");
export const getAdminDashboard = () => request<AdminDashboardResponse>("GET", "/admin/dashboard");
export const getAdminActivities = ({
    page = 1,
    limit = 20,
    type,
    actorId,
}: AdminActivityFilters = {}) => {
    const queryParams: Record<string, QueryValue> = { page, limit };
    if (type) queryParams.type = type;
    if (actorId?.trim()) queryParams.actorId = actorId.trim();

    return request<AdminActivitiesResponse>("GET", "/admin/activities", { queryParams });
};
export const getAdminReports = ({
    page = 1,
    limit = 20,
    status,
    targetType,
}: AdminReportFilters = {}) => {
    const queryParams: Record<string, QueryValue> = { page, limit };
    if (status) queryParams.status = status;
    if (targetType) queryParams.targetType = targetType;

    return request<AdminReportsResponse>("GET", "/admin/reports", { queryParams });
};
export const getAdminReport = (id: string) =>
    request<UserReport>("GET", `/admin/reports/${id}`);
export const updateAdminReportStatus = (id: string, status: Exclude<ReportStatus, "pending">, note?: string) =>
    request<UserReport>("PATCH", `/admin/reports/${id}/status`, {
        body: note?.trim() ? { status, note: note.trim() } : { status },
    });
export const applyAdminReportAction = (id: string, action: Exclude<ReportAction, "none">, note?: string) =>
    request<UserReport>("PATCH", `/admin/reports/${id}/action`, {
        body: note?.trim() ? { action, note: note.trim() } : { action },
    });
export const getAdminUsers = (query = "", page = 1, limit = 20) =>
    request<AdminUsersResponse>("GET", "/admin/users", { queryParams: { query, page, limit } });
export const getAdminUser = (id: string) =>
    request<AdminUserDetailResponse>("GET", `/admin/users/${id}`);
export const createAdminUser = (data: AdminUserInput & { password: string }) =>
    request<AdminUserDetailResponse>("POST", "/admin/users", { body: { ...data } });
export const updateAdminUser = (id: string, data: AdminUserUpdateInput) =>
    request<AdminUserDetailResponse>("PATCH", `/admin/users/${id}`, { body: { ...data } });
export const blockAdminUser = (id: string) => request<void>("PATCH", `/admin/users/${id}/block`);
export const unblockAdminUser = (id: string) => request<void>("PATCH", `/admin/users/${id}/unblock`);
export const deleteAdminUser = (id: string) => request<void>("DELETE", `/admin/users/${id}`);
export const bulkDeleteAdminUsers = (ids: string[]) =>
    request<BulkDeleteResponse>("POST", "/admin/users/bulk-delete", { body: { ids } });
export const bulkCreateAdminUsers = (users: AdminBulkUserInput[]) =>
    request<AdminBulkCreateUsersResponse>("POST", "/admin/users/bulk-create", { body: { users } });
export const getAdminPosts = (
    query = "",
    authorId = "",
    visibility = "",
    page = 1,
    limit = 20
) => request<AdminPostsResponse>("GET", "/admin/posts", {
    queryParams: { query, authorId, visibility, page, limit },
});
export const getAdminPost = (id: string) => request<IPost>("GET", `/admin/posts/${id}`);
export const deleteAdminPost = (id: string) => request<void>("DELETE", `/admin/posts/${id}`);
export const bulkDeleteAdminPosts = (ids: string[]) =>
    request<BulkDeleteResponse>("POST", "/admin/posts/bulk-delete", { body: { ids } });
export const bulkCreateAdminPosts = (posts: AdminBulkPostInput[]) =>
    request<AdminBulkCreatePostsResponse>("POST", "/admin/posts/bulk-create", { body: { posts } });
export const deleteAdminComment = (commentId: string) =>
    request<void>("DELETE", `/admin/comments/${commentId}`);
export const bulkDeleteAdminComments = (ids: string[]) =>
    request<BulkDeleteResponse>("POST", "/admin/comments/bulk-delete", { body: { ids } });
export const deleteAdminReply = (commentId: string, replyIndex: number) =>
    request<void>("DELETE", `/admin/comments/${commentId}/replies/${replyIndex}`);

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
