import {
    BasicUserSummary,
    IUser,
    MutedUsersResponse,
    PaginatedResponse,
    ProfileUpdateInput,
    PublicUserProfile,
    UserPostsResponse,
    UserResponse,
    MyActivitiesResponse,
} from "@/app/types/user";
import { QueryValue, request } from "./client";
import { FollowResponse, MessageResponse, MyActivityFilters, RawMutedUsersResponse } from "./contracts";

export const getMe = () => request<UserResponse>("GET", "/users/me");
export const getUserProfile = (id: string) => request<PublicUserProfile>("GET", `/users/profile/${id}`);
export const getUserPosts = (id: string, page = 1, limit = 20) =>
    request<UserPostsResponse>("GET", `/users/${id}/posts`, { queryParams: { page, limit } });
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
