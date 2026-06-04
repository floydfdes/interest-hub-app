import { IComment, IReply } from "@/app/types/user";
import { request } from "./client";

export const createComment = (postId: string, content: string) =>
    request<IComment>("POST", "/comments", { body: { postId, content } });
export const editComment = (commentId: string, content: string) =>
    request<IComment>("PATCH", `/comments/${commentId}`, { body: { content } });
export const deleteComment = (commentId: string) =>
    request<void>("DELETE", `/comments/${commentId}`);
export const likeComment = (commentId: string) =>
    request<Pick<IComment, "likes">>("POST", `/comments/${commentId}/like`);
export const unlikeComment = (commentId: string) =>
    request<Pick<IComment, "likes">>("POST", `/comments/${commentId}/unlike`);
export const replyToComment = (commentId: string, content: string) =>
    request<IReply>("POST", `/comments/${commentId}/reply`, { body: { content } });
export const editReply = (commentId: string, replyIndex: number, content: string) =>
    request<IReply>("PATCH", `/comments/${commentId}/reply/${replyIndex}`, { body: { content } });
export const deleteReply = (commentId: string, replyIndex: number) =>
    request<void>("DELETE", `/comments/${commentId}/reply/${replyIndex}`);
export const likeReply = (commentId: string, replyIndex: number) =>
    request<void>("POST", `/comments/${commentId}/reply/${replyIndex}/like`);
export const unlikeReply = (commentId: string, replyIndex: number) =>
    request<void>("POST", `/comments/${commentId}/reply/${replyIndex}/unlike`);
export const replyToReply = (commentId: string, parentReplyIndex: number, content: string) =>
    request<void>("POST", `/comments/${commentId}/reply/${parentReplyIndex}/reply`, { body: { content } });
