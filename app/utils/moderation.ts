import { IComment, IPost, IReply, ModerationNotice } from '@/app/types/user';

export type MaybeModerated = {
    needsReview?: boolean;
    moderationReasons?: string[];
    moderationNotice?: ModerationNotice;
};

export function isUnderReview(content: MaybeModerated | null | undefined) {
    return Boolean(content?.needsReview || content?.moderationNotice?.needsReview);
}

export function getModerationNoticeMessage(content: MaybeModerated | null | undefined) {
    return content?.moderationNotice?.message || '';
}

export function filterVisiblePosts<T extends IPost>(posts: T[]) {
    return posts.filter((post) => !isUnderReview(post));
}

export function filterVisibleComments<T extends IComment>(comments: T[]) {
    return comments
        .filter((comment) => !isUnderReview(comment))
        .map((comment) => ({
            ...comment,
            replies: (comment.replies || []).filter((reply: IReply) => !isUnderReview(reply)),
        }));
}
