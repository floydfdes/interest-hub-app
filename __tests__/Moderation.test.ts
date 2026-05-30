import { filterVisibleComments, filterVisiblePosts, getModerationNoticeMessage, isUnderReview } from '@/app/utils/moderation';
import { IComment, IPost, ModerationNotice } from '@/app/types/user';

const notice = {
    needsReview: true,
    reasons: ['bad_language'],
    message: 'Your content was flagged for language review.',
} satisfies ModerationNotice;

describe('moderation helpers', () => {
    it('detects moderation notices and returns the user-facing message', () => {
        expect(isUnderReview({ moderationNotice: notice })).toBe(true);
        expect(isUnderReview({ needsReview: true })).toBe(true);
        expect(isUnderReview({})).toBe(false);
        expect(getModerationNoticeMessage({ moderationNotice: notice })).toBe(notice.message);
    });

    it('filters flagged posts, comments, and replies from public rendering', () => {
        const visiblePost = { _id: 'post-1' } as IPost;
        const flaggedPost = { _id: 'post-2', needsReview: true } as IPost;
        expect(filterVisiblePosts([visiblePost, flaggedPost])).toEqual([visiblePost]);

        const comments = [{
            _id: 'comment-1',
            replies: [
                { _id: 'reply-1', content: 'visible' },
                { _id: 'reply-2', content: 'flagged', moderationNotice: notice },
            ],
        }, {
            _id: 'comment-2',
            needsReview: true,
            replies: [],
        }] as IComment[];

        expect(filterVisibleComments(comments)).toEqual([{
            _id: 'comment-1',
            replies: [{ _id: 'reply-1', content: 'visible' }],
        }]);
    });
});
