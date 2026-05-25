import { updateAdminUser } from '@/app/api/api';
import { AdminUser } from '@/app/types/user';
import AdminUserModal from '@/components/admin/AdminUserModal';
import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    createAdminUser: jest.fn(),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    updateAdminUser: jest.fn(),
}));

const mockedUpdateAdminUser = jest.mocked(updateAdminUser);
const user = {
    _id: 'user-1',
    name: 'Alex',
    email: 'alex@example.com',
    role: 'user',
    profilePic: null,
    bio: '',
    interests: ['Design'],
    isBlocked: false,
} as AdminUser;

describe('AdminUserModal', () => {
    it('only sends changed fields when editing a user', async () => {
        mockedUpdateAdminUser.mockResolvedValue({} as never);
        const onSaved = jest.fn();

        render(
            <App>
                <AdminUserModal user={user} onClose={jest.fn()} onSaved={onSaved} />
            </App>
        );

        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alex Updated' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

        await waitFor(() => expect(mockedUpdateAdminUser).toHaveBeenCalledWith('user-1', { name: 'Alex Updated' }));
        expect(onSaved).toHaveBeenCalled();
    });
});
