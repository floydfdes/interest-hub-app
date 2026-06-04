import { TagPostsResponse, TagSummary, TrendingTag } from "@/app/types/user";
import { request } from "./client";

export const getTagSuggestions = (query: string, limit = 10) =>
    request<TagSummary[]>("GET", "/tags/suggestions", { queryParams: { query, limit } });
export const getTrendingTags = (limit = 20) =>
    request<TrendingTag[]>("GET", "/tags/trending", { queryParams: { limit } });
export const getTagPosts = (tag: string, page = 1, limit = 20) =>
    request<TagPostsResponse>("GET", `/tags/${encodeURIComponent(tag)}/posts`, { queryParams: { page, limit } });
