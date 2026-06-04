import {
    ArchivedPostsResponse,
    CollectionPostsResponse,
    DraftPostInput,
    DraftPostsResponse,
    GlobalSearchResponse,
    IComment,
    IPost,
    IUser,
    PaginatedResponse,
    PostInput,
    PostUpdateInput,
    RecentlyViewedPostsResponse,
    SavedCollection,
    SavedCollectionsResponse,
} from "@/app/types/user";
import { QueryValue, request } from "./client";
import { ArchivedPostResponse, MessageResponse, PostAdvancedSearchFilters, TrendingPeriod } from "./contracts";

export const getAllPosts = (page = 1, limit = 20) =>
    request<PaginatedResponse<IPost>>("GET", "/posts", { queryParams: { page, limit } });
export const searchPosts = (query: string) =>
    request<IPost[]>("GET", "/posts/search", { queryParams: { query } });
export const globalSearch = (query: string, limit = 5) =>
    request<GlobalSearchResponse>("GET", "/search", { queryParams: { query, limit } });
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
export const likePost = (id: string) =>
    request<Pick<IPost, "likesCount" | "isLikedByMe">>("POST", `/posts/${id}/like`);
export const unlikePost = (id: string) =>
    request<Pick<IPost, "likesCount" | "isLikedByMe">>("POST", `/posts/${id}/unlike`);
export const getPostComments = (id: string, page = 1, limit = 20) =>
    request<PaginatedResponse<IComment>>("GET", `/posts/${id}/comments`, { queryParams: { page, limit } });
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
export const getSavedCollections = () => request<SavedCollectionsResponse>("GET", "/posts/saved-collections");
export const createSavedCollection = (name: string) =>
    request<SavedCollection>("POST", "/posts/saved-collections", { body: { name } });
export const updateSavedCollection = (collectionId: string, name: string) =>
    request<SavedCollection>("PUT", `/posts/saved-collections/${collectionId}`, { body: { name } });
export const deleteSavedCollection = (collectionId: string) =>
    request<MessageResponse>("DELETE", `/posts/saved-collections/${collectionId}`);
export const getSavedCollectionPosts = (collectionId: string, page = 1, limit = 20) =>
    request<CollectionPostsResponse>("GET", `/posts/saved-collections/${collectionId}/posts`, { queryParams: { page, limit } });
export const addPostToSavedCollection = (collectionId: string, postId: string) =>
    request<MessageResponse>("POST", `/posts/saved-collections/${collectionId}/posts/${postId}`);
export const removePostFromSavedCollection = (collectionId: string, postId: string) =>
    request<MessageResponse>("DELETE", `/posts/saved-collections/${collectionId}/posts/${postId}`);
export const getRecentlyViewedPosts = (page = 1, limit = 20) =>
    request<RecentlyViewedPostsResponse>("GET", "/posts/recently-viewed", { queryParams: { page, limit } });
export const hidePost = (id: string) => request<MessageResponse>("POST", `/posts/${id}/hide`);
export const unhidePost = (id: string) => request<MessageResponse>("DELETE", `/posts/${id}/hide`);
export const getHiddenPosts = (page = 1, limit = 20) =>
    request<PaginatedResponse<IPost>>("GET", "/posts/hidden", { queryParams: { page, limit } });
export const archivePost = (id: string) => request<ArchivedPostResponse>("PATCH", `/posts/${id}/archive`);
export const unarchivePost = (id: string) => request<ArchivedPostResponse>("PATCH", `/posts/${id}/unarchive`);
export const pinPost = (id: string) => request<MessageResponse>("PATCH", `/posts/${id}/pin`);
export const unpinPost = (id: string) => request<MessageResponse>("PATCH", `/posts/${id}/unpin`);
export const getArchivedPosts = (page = 1, limit = 20) =>
    request<ArchivedPostsResponse>("GET", "/posts/archived", { queryParams: { page, limit } });
export const getReviewPosts = (page = 1, limit = 20) =>
    request<PaginatedResponse<IPost>>("GET", "/posts/review", { queryParams: { page, limit } });
export const createDraftPost = (data: DraftPostInput) =>
    request<IPost>("POST", "/posts/drafts", { body: { ...data } });
export const getDraftPosts = (page = 1, limit = 20) =>
    request<DraftPostsResponse>("GET", "/posts/drafts", { queryParams: { page, limit } });
export const updateDraftPost = (id: string, data: DraftPostInput) =>
    request<IPost>("PUT", `/posts/drafts/${id}`, { body: { ...data } });
export const publishDraftPost = (id: string) =>
    request<IPost>("POST", `/posts/drafts/${id}/publish`);
