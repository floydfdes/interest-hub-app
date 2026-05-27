import { ApiError, followUser, getSuggestedUsers } from '@/app/api/api';
import { IUser } from '@/app/types/user';
import SuggestedUsers from '@/components/features/SuggestedUsers';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    ApiError: class ApiError extends Error {
        status: number;

        constructor(message: string, status: number) {
            super(message);
            this.status = status;
        }
    },
    followUser: jest.fn(),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    getSuggestedUsers: jest.fn(),
}));

const mockedGetSuggestedUsers = jest.mocked(getSuggestedUsers);
const mockedFollowUser = jest.mocked(followUser);

describe('SuggestedUsers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('loads suggestions and removes a person after following', async () => {
        mockedGetSuggestedUsers.mockResolvedValue([{ _id: 'suggested-1', name: 'Anya', interests: ['Design'] } as IUser]);
        mockedFollowUser.mockResolvedValue({ message: 'Followed successfully', status: 'followed' });

        render(<SuggestedUsers authenticated />);

        expect(await screen.findByText('Anya')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Follow Anya' }));

        await waitFor(() => expect(mockedFollowUser).toHaveBeenCalledWith('suggested-1'));
        expect(screen.queryByText('Anya')).not.toBeInTheDocument();
    });

    it('shows the generic relationship message when following is blocked', async () => {
        mockedGetSuggestedUsers.mockResolvedValue([{ _id: 'suggested-1', name: 'Anya' } as IUser]);
        mockedFollowUser.mockRejectedValue(new ApiError('Forbidden', 403));

        render(<SuggestedUsers authenticated />);
        fireEvent.click(await screen.findByRole('button', { name: 'Follow Anya' }));

        expect(await screen.findByText('You cannot follow this user.')).toBeInTheDocument();
    });

    it('keeps a private user visible with requested status after sending a follow request', async () => {
        mockedGetSuggestedUsers.mockResolvedValue([{ _id: 'suggested-1', name: 'Anya' } as IUser]);
        mockedFollowUser.mockResolvedValue({ message: 'Follow request sent', status: 'requested' });

        render(<SuggestedUsers authenticated />);
        fireEvent.click(await screen.findByRole('button', { name: 'Follow Anya' }));

        expect(await screen.findByRole('button', { name: 'Requested Anya' })).toBeDisabled();
        expect(screen.getByText('Anya')).toBeInTheDocument();
    });
});
