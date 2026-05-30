import BlockedUsersPage from '@/app/profile/blocked/page';
import { getBlockedUsers, unblockUser } from '@/app/api/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    getBlockedUsers: jest.fn(),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    unblockUser: jest.fn(),
}));

const mockedGetBlockedUsers = jest.mocked(getBlockedUsers);
const mockedUnblockUser = jest.mocked(unblockUser);

describe('BlockedUsersPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.setItem('token', 'test-token');
        mockedGetBlockedUsers.mockResolvedValue({
            items: [{ _id: 'user-2', name: 'Jordan', profilePic: null }],
            pagination: {
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        });
        mockedUnblockUser.mockResolvedValue({ message: 'User unblocked' });
    });

    it('loads blocked users and removes one after unblocking', async () => {
        render(<BlockedUsersPage />);

        expect(await screen.findByText('Jordan')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Unblock' }));

        await waitFor(() => expect(mockedUnblockUser).toHaveBeenCalledWith('user-2'));
        expect(screen.queryByText('Jordan')).not.toBeInTheDocument();
    });
});
