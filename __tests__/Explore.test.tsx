import Explore from '@/app/explore/page';
import { getRecommendedPosts, getTrendingPosts, muteUser } from '@/app/api/api';
import { IUser } from '@/app/types/user';
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
    getSuggestedUsers: jest.fn(() => Promise.resolve([])),
    followUser: jest.fn(),
    hidePost: jest.fn(),
    muteUser: jest.fn(() => Promise.resolve({ message: 'User muted' })),
    getRecommendedPosts: jest.fn(() => Promise.resolve([])),
    getTrendingPosts: jest.fn(() => Promise.resolve([])),
    searchPosts: jest.fn(() => Promise.resolve([])),
}));

let mockCurrentUser: IUser | null = null;

jest.mock('@/app/hooks/useCurrentUser', () => ({
    useCurrentUser: () => mockCurrentUser,
}));

const mockedGetTrendingPosts = jest.mocked(getTrendingPosts);
const mockedGetRecommendedPosts = jest.mocked(getRecommendedPosts);
const mockedMuteUser = jest.mocked(muteUser);

describe('Explore discovery feeds', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        mockCurrentUser = null;
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

    it('refreshes a personalized feed after muting a post author', async () => {
        mockCurrentUser = { _id: 'me', mutedUsers: [] } as unknown as IUser;
        localStorage.setItem('token', 'test-token');
        mockedGetRecommendedPosts.mockResolvedValue([{
            _id: 'post-1',
            title: 'From Jordan',
            content: 'Post',
            author: { _id: 'user-2', name: 'Jordan', profilePic: '' },
            comments: [],
            likes: [],
            createdAt: new Date().toISOString(),
        } as never]);

        render(<Explore />);
        await waitFor(() => expect(mockedGetTrendingPosts).toHaveBeenCalledWith('week'));
        fireEvent.click(screen.getByRole('button', { name: /Recommended/ }));

        const actionsButton = await screen.findByRole('button', { name: 'More actions for From Jordan' });
        fireEvent.click(actionsButton);
        expect(screen.getByRole('button', { name: 'Mute user' })).toBeInTheDocument();
        fireEvent.mouseDown(document.body);
        expect(screen.queryByRole('button', { name: 'Mute user' })).not.toBeInTheDocument();

        fireEvent.click(actionsButton);
        fireEvent.click(screen.getByRole('button', { name: 'Mute user' }));
        await waitFor(() => expect(mockedMuteUser).toHaveBeenCalledWith('user-2'));
        await waitFor(() => expect(mockedGetRecommendedPosts).toHaveBeenCalledTimes(2));
    });
});
