import { followUser, getSuggestedUsers } from '@/app/api/api';
import { IUser } from '@/app/types/user';
import SuggestedUsers from '@/components/features/SuggestedUsers';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    followUser: jest.fn(),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    getSuggestedUsers: jest.fn(),
}));

const mockedGetSuggestedUsers = jest.mocked(getSuggestedUsers);
const mockedFollowUser = jest.mocked(followUser);

describe('SuggestedUsers', () => {
    it('loads suggestions and removes a person after following', async () => {
        mockedGetSuggestedUsers.mockResolvedValue([{ _id: 'suggested-1', name: 'Anya', interests: ['Design'] } as IUser]);
        mockedFollowUser.mockResolvedValue(undefined);

        render(<SuggestedUsers authenticated />);

        expect(await screen.findByText('Anya')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Follow Anya' }));

        await waitFor(() => expect(mockedFollowUser).toHaveBeenCalledWith('suggested-1'));
        expect(screen.queryByText('Anya')).not.toBeInTheDocument();
    });
});
