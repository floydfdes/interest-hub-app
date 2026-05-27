import SettingsPage from '@/app/profile/settings/page';
import { getMe, updateUser } from '@/app/api/api';
import { IUser } from '@/app/types/user';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    changePassword: jest.fn(),
    deleteUser: jest.fn(),
    forgotPassword: jest.fn(),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    getMe: jest.fn(),
    resetPassword: jest.fn(),
    updateUser: jest.fn(),
}));

jest.mock('@/app/hooks/useCurrentUser', () => ({
    notifyAuthChanged: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
}));

const mockedGetMe = jest.mocked(getMe);
const mockedUpdateUser = jest.mocked(updateUser);

describe('profile privacy settings', () => {
    it('updates private account status through profile update', async () => {
        const user = { _id: 'me', isPrivate: false } as IUser;
        mockedGetMe.mockResolvedValue({ user });
        mockedUpdateUser.mockResolvedValue({ user: { ...user, isPrivate: true } });
        localStorage.setItem('token', 'test-token');

        render(<SettingsPage />);
        const toggle = await screen.findByRole('checkbox', { name: 'Private account' });
        await waitFor(() => expect(toggle).not.toBeDisabled());
        fireEvent.click(toggle);

        await waitFor(() => expect(mockedUpdateUser).toHaveBeenCalledWith({ isPrivate: true }));
        await waitFor(() => expect(toggle).toBeChecked());
    });
});
