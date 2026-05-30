import ReviewPostsPage from '@/app/profile/review-posts/page';
import { getReviewPosts } from '@/app/api/api';
import { IPost } from '@/app/types/user';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    getReviewPosts: jest.fn(),
}));

const mockedGetReviewPosts = jest.mocked(getReviewPosts);

const firstPage = {
    items: [{
        _id: 'post-1',
        title: 'Flagged post',
        image: '',
        moderationReasons: ['bad_language'],
        moderationNotice: {
            needsReview: true,
            reasons: ['bad_language'],
            message: 'Your content was flagged for language review.',
        },
    } as IPost],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 2, hasNextPage: true, hasPreviousPage: false },
};

const secondPage = {
    items: [{ _id: 'post-2', title: 'Second flagged post', image: '', moderationReasons: ['bad_language'] } as IPost],
    pagination: { page: 2, limit: 20, total: 2, totalPages: 2, hasNextPage: false, hasPreviousPage: true },
};

describe('ReviewPostsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetReviewPosts.mockResolvedValue(firstPage);
    });

    it('loads posts under review with labels and moderation notice', async () => {
        render(<ReviewPostsPage />);

        expect(await screen.findByText('Flagged post')).toBeInTheDocument();
        expect(screen.getByText('Under review')).toBeInTheDocument();
        expect(screen.getByText('Your content was flagged for language review.')).toBeInTheDocument();
        expect(screen.getByText('bad language')).toBeInTheDocument();
        expect(within(screen.getByRole('link', { name: 'Edit' })).getByText('Edit')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/explore/post/post-1/edit');
    });

    it('loads more review posts with pagination', async () => {
        mockedGetReviewPosts.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);

        render(<ReviewPostsPage />);

        fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));

        await waitFor(() => expect(mockedGetReviewPosts).toHaveBeenCalledWith(2, 20));
        expect(await screen.findByText('Second flagged post')).toBeInTheDocument();
    });
});
