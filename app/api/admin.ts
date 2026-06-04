import {
    AdminActivitiesResponse,
    AdminBulkCreatePostsResponse,
    AdminBulkCreateUsersResponse,
    AdminBulkPostInput,
    AdminBulkUserInput,
    AdminDashboardResponse,
    AdminPostsResponse,
    AdminReportsResponse,
    AdminUserDetailResponse,
    AdminUserInput,
    AdminUsersResponse,
    AdminUserUpdateInput,
    IPost,
    ReportAction,
    ReportStatus,
    UserReport,
} from "@/app/types/user";
import { QueryValue, request } from "./client";
import { AdminActivityFilters, AdminReportFilters, BulkDeleteResponse } from "./contracts";

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
