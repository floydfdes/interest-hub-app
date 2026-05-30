import PublicProfilePage from '@/app/users/[id]/page';
import { followUser, getUserProfile } from '@/app/api/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    followUser: jest.fn(),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    getUserProfile: jest.fn(),
    unfollowUser: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useParams: () => ({ id: 'user-2' }),
}));

const mockedGetUserProfile = jest.mocked(getUserProfile);
const mockedFollowUser = jest.mocked(followUser);

describe('PublicProfilePage', () => {
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
        });
        mockedFollowUser.mockResolvedValue({ message: 'Follow request sent', status: 'requested' });

        render(<PublicProfilePage />);
        fireEvent.click(await screen.findByRole('button', { name: 'Follow' }));

        await waitFor(() => expect(mockedFollowUser).toHaveBeenCalledWith('user-2'));
        expect(await screen.findByRole('button', { name: 'Requested' })).toBeDisabled();
    });
});
