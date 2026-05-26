import UserSearchPage from '@/app/users/page';
import { blockUser, getMe, muteUser, searchUsers, unblockUser, unmuteUser } from '@/app/api/api';
import { IUser } from '@/app/types/user';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Swal from 'sweetalert2';

jest.mock('@/app/api/api', () => ({
    ApiError: class ApiError extends Error {
        status: number;

        constructor(message: string, status: number) {
            super(message);
            this.status = status;
        }
    },
    blockUser: jest.fn(),
    followUser: jest.fn(),
    getMe: jest.fn(),
    muteUser: jest.fn(),
    searchUsers: jest.fn(),
    unblockUser: jest.fn(),
    unfollowUser: jest.fn(),
    unmuteUser: jest.fn(),
}));

jest.mock('sweetalert2', () => ({
    fire: jest.fn(),
}));

const mockedBlockUser = jest.mocked(blockUser);
const mockedGetMe = jest.mocked(getMe);
const mockedSearchUsers = jest.mocked(searchUsers);
const mockedMuteUser = jest.mocked(muteUser);
const mockedUnblockUser = jest.mocked(unblockUser);
const mockedUnmuteUser = jest.mocked(unmuteUser);
const mockedSwal = jest.mocked(Swal.fire);

describe('People personal blocking controls', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('token', 'test-token');
        mockedGetMe.mockResolvedValue({
            user: { _id: 'me', following: ['user-2'], blockedUsers: [], mutedUsers: [] } as unknown as IUser,
        });
        mockedSearchUsers.mockResolvedValue([{
            _id: 'user-2',
            name: 'Jordan',
            following: [],
            followers: [],
            interests: [],
            createdAt: new Date().toISOString(),
        } as unknown as IUser]);
        mockedSwal.mockResolvedValue({ isConfirmed: true } as never);
        mockedBlockUser.mockResolvedValue({ message: 'User blocked' });
        mockedUnblockUser.mockResolvedValue({ message: 'User unblocked' });
        mockedMuteUser.mockResolvedValue({ message: 'User muted' });
        mockedUnmuteUser.mockResolvedValue({ message: 'User unmuted' });
    });

    it('loads public people without requesting the current profile when logged out', async () => {
        localStorage.clear();
        render(<UserSearchPage />);

        expect(await screen.findByText('Jordan')).toBeInTheDocument();
        expect(mockedGetMe).not.toHaveBeenCalled();
        expect(screen.queryByText('Failed to load user data')).not.toBeInTheDocument();
    });

    it('keeps public people visible when authenticated profile state cannot load', async () => {
        mockedGetMe.mockRejectedValueOnce(new Error('Profile unavailable'));
        render(<UserSearchPage />);

        expect(await screen.findByText('Jordan')).toBeInTheDocument();
        expect(screen.queryByText('Failed to load user data')).not.toBeInTheDocument();
    });

    it('stays quiet if the initial people request fails but reports a submitted search failure', async () => {
        mockedSearchUsers.mockRejectedValueOnce(new Error('Initial unavailable'));
        render(<UserSearchPage />);

        await waitFor(() => expect(mockedSearchUsers).toHaveBeenCalledWith(''));
        expect(screen.queryByText('Search failed')).not.toBeInTheDocument();

        mockedSearchUsers.mockRejectedValueOnce(new Error('Search unavailable'));
        fireEvent.change(screen.getByTestId('users-search-input'), { target: { value: 'design' } });
        fireEvent.submit(screen.getByTestId('users-search-input').closest('form') as HTMLFormElement);

        expect(await screen.findByText('Search failed')).toBeInTheDocument();
    });

    it('searches when Enter is pressed in the search input', async () => {
        render(<UserSearchPage />);
        await screen.findByText('Jordan');

        fireEvent.change(screen.getByTestId('users-search-input'), { target: { value: 'design' } });
        fireEvent.submit(screen.getByTestId('users-search-input').closest('form') as HTMLFormElement);

        await waitFor(() => expect(mockedSearchUsers).toHaveBeenLastCalledWith('design'));
    });

    it('closes its actions menu when clicking away', async () => {
        render(<UserSearchPage />);
        await screen.findByText('Jordan');

        fireEvent.click(screen.getByRole('button', { name: 'More actions for Jordan' }));
        expect(screen.getByRole('button', { name: 'Block' })).toBeInTheDocument();

        fireEvent.mouseDown(document.body);
        expect(screen.queryByRole('button', { name: 'Block' })).not.toBeInTheDocument();
    });

    it('confirms blocking, removes the follow control, and permits unblocking', async () => {
        render(<UserSearchPage />);

        expect(await screen.findByText('Jordan')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Unfollow' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Block' })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'More actions for Jordan' }));
        fireEvent.click(screen.getByRole('button', { name: 'Block' }));
        await waitFor(() => expect(mockedBlockUser).toHaveBeenCalledWith('user-2'));
        expect(mockedSwal).toHaveBeenCalledWith(expect.objectContaining({
            text: 'Blocking this user will remove any follow connection between you.',
        }));
        expect(screen.queryByRole('button', { name: 'Unfollow' })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'More actions for Jordan' }));
        fireEvent.click(screen.getByRole('button', { name: 'Unblock' }));
        await waitFor(() => expect(mockedUnblockUser).toHaveBeenCalledWith('user-2'));
        expect(await screen.findByRole('button', { name: 'Follow' })).toBeInTheDocument();
    });

    it('mutes and unmutes without removing the follow relationship', async () => {
        render(<UserSearchPage />);

        expect(await screen.findByRole('button', { name: 'More actions for Jordan' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Mute' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'More actions for Jordan' }));
        fireEvent.click(screen.getByRole('button', { name: 'Mute' }));

        await waitFor(() => expect(mockedMuteUser).toHaveBeenCalledWith('user-2'));
        expect(screen.getByRole('button', { name: 'Unfollow' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'More actions for Jordan' }));
        fireEvent.click(screen.getByRole('button', { name: 'Unmute' }));

        await waitFor(() => expect(mockedUnmuteUser).toHaveBeenCalledWith('user-2'));
        expect(screen.queryByRole('button', { name: 'Mute' })).not.toBeInTheDocument();
    });
});
