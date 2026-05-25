import Explore from '@/app/explore/page';
import { getRecommendedPosts, getTrendingPosts } from '@/app/api/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    advancedSearchPosts: jest.fn(() => Promise.resolve([])),
    deletePost: jest.fn(),
    getBookmarkedPosts: jest.fn(() => Promise.resolve([])),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    getFollowingPosts: jest.fn(() => Promise.resolve({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
    })),
    getRecommendedPosts: jest.fn(() => Promise.resolve([])),
    getTrendingPosts: jest.fn(() => Promise.resolve([])),
    searchPosts: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/app/hooks/useCurrentUser', () => ({
    useCurrentUser: () => null,
}));

const mockedGetTrendingPosts = jest.mocked(getTrendingPosts);
const mockedGetRecommendedPosts = jest.mocked(getRecommendedPosts);

describe('Explore discovery feeds', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    it('loads public trending posts and changes trending period', async () => {
        render(<Explore />);

        await waitFor(() => expect(mockedGetTrendingPosts).toHaveBeenCalledWith('week'));
        fireEvent.change(screen.getByRole('combobox', { name: 'Trending period' }), { target: { value: 'day' } });
        await waitFor(() => expect(mockedGetTrendingPosts).toHaveBeenCalledWith('day'));
    });

    it('shows a login state for personalized feeds when signed out', async () => {
        render(<Explore />);
        await waitFor(() => expect(mockedGetTrendingPosts).toHaveBeenCalled());

        fireEvent.click(screen.getByRole('button', { name: /Recommended/ }));

        expect(await screen.findByText('Log in to view personalized discovery posts.')).toBeInTheDocument();
        expect(mockedGetRecommendedPosts).not.toHaveBeenCalled();
    });
});
