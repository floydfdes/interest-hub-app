import MutedUsersPage from '@/app/profile/muted/page';
import { getMutedUsers, unmuteUser } from '@/app/api/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    getMutedUsers: jest.fn(),
    unmuteUser: jest.fn(),
}));

const mockedGetMutedUsers = jest.mocked(getMutedUsers);
const mockedUnmuteUser = jest.mocked(unmuteUser);

describe('MutedUsersPage', () => {
    it('loads muted users and removes one after unmuting', async () => {
        mockedGetMutedUsers.mockResolvedValue({
            items: [{ _id: 'user-2', name: 'Jordan', profilePic: null }],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        });
        mockedUnmuteUser.mockResolvedValue({ message: 'User unmuted' });

        render(<MutedUsersPage />);

        expect(await screen.findByText('Jordan')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Unmute' }));
        await waitFor(() => expect(mockedUnmuteUser).toHaveBeenCalledWith('user-2'));
        expect(screen.queryByText('Jordan')).not.toBeInTheDocument();
    });
});
