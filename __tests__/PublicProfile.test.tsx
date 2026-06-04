import PublicProfilePage from '@/app/users/[id]/page';
import { followUser, getUserPosts, getUserProfile } from '@/app/api/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    followUser: jest.fn(),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    getUserProfile: jest.fn(),
    getUserPosts: jest.fn(),
    unfollowUser: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useParams: () => ({ id: 'user-2' }),
}));

const mockedGetUserProfile = jest.mocked(getUserProfile);
const mockedGetUserPosts = jest.mocked(getUserPosts);
const mockedFollowUser = jest.mocked(followUser);

describe('PublicProfilePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetUserPosts.mockResolvedValue({
            items: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
        });
    });

    it('does not reveal a restricted private profile and shows requested state', async () => {
        mockedGetUserProfile.mockResolvedValue({
            _id: 'user-2',
            name: 'Jane',
            profilePic: null,
            isPrivate: true,
            isFollowing: false,
            hasRequestedFollow: true,
            canViewProfile: false,
            followersCount: 10,
            followingCount: 4,
            postsCount: 0,
        });

        render(<PublicProfilePage />);

        expect(await screen.findByText('Jane')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Requested' })).toBeDisabled();
        expect(screen.getByText(/This profile is private/)).toBeInTheDocument();
        expect(screen.queryByText('Hello')).not.toBeInTheDocument();
    });

    it('changes Follow to Requested when a private follow is submitted', async () => {
        mockedGetUserProfile.mockResolvedValue({
            _id: 'user-2',
            name: 'Jane',
            profilePic: null,
            isPrivate: true,
            isFollowing: false,
            hasRequestedFollow: false,
            canViewProfile: false,
            followersCount: 10,
            followingCount: 4,
            postsCount: 0,
        });
        mockedFollowUser.mockResolvedValue({ message: 'Follow request sent', status: 'requested' });

        render(<PublicProfilePage />);
        fireEvent.click(await screen.findByRole('button', { name: 'Follow' }));

        await waitFor(() => expect(mockedFollowUser).toHaveBeenCalledWith('user-2'));
        expect(await screen.findByRole('button', { name: 'Requested' })).toBeDisabled();
    });

    it('shows post count and profile posts in a three-column image grid', async () => {
        mockedGetUserProfile.mockResolvedValue({
            _id: 'user-2',
            name: 'Jane',
            profilePic: null,
            isPrivate: false,
            isFollowing: false,
            hasRequestedFollow: false,
            canViewProfile: true,
            followersCount: 10,
            followingCount: 4,
            postsCount: 1,
            mutualFollowers: [
                { _id: 'user-3', name: 'Alex', username: 'alex', profilePic: null },
                { _id: 'user-4', name: 'Sam', username: 'sam', profilePic: null },
            ],
            mutualFollowersCount: 6,
            pinnedPost: {
                _id: 'post-pinned',
                title: 'Pinned thought',
                image: '/pinned.png',
                isPinned: true,
                pinnedAt: '2026-06-03T00:00:00.000Z',
            },
        });
        mockedGetUserPosts.mockResolvedValue({
            items: [{
                _id: 'post-1',
                title: 'Jane post',
                content: 'A public thought',
                image: '/post.png',
                category: 'Tech',
                tags: [],
                author: { _id: 'user-2', name: 'Jane', profilePic: '/avatar.png' },
                likes: [],
                comments: [],
                likesCount: 0,
                commentsCount: 0,
                isLikedByMe: false,
                isSavedByMe: false,
                visibility: 'public',
                viewCount: 0,
                sharedFrom: null,
                isEdited: false,
                createdAt: '2026-05-30T00:00:00.000Z',
                updatedAt: '2026-05-30T00:00:00.000Z',
            }],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        });

        render(<PublicProfilePage />);

        expect(await screen.findByText('Jane post')).toBeInTheDocument();
        expect(screen.getByText('Followed by Alex, Sam and 4 others')).toBeInTheDocument();
        expect(screen.getByText('Pinned thought')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Pinned thought/ })).toHaveAttribute('href', '/posts/post-pinned');
        expect(screen.getAllByText('Posts')).toHaveLength(2);
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Jane post' })).toHaveAttribute('href', '/posts/post-1');
        expect(screen.queryByText('A public thought')).not.toBeInTheDocument();
    });
});
