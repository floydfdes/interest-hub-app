import { bulkCreateAdminPosts, bulkCreateAdminUsers, getAdminUsers } from '@/app/api/api';
import { AdminUser } from '@/app/types/user';
import AdminBulkPostModal from '@/components/admin/AdminBulkPostModal';
import AdminBulkUserModal from '@/components/admin/AdminBulkUserModal';
import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    bulkCreateAdminPosts: jest.fn(),
    bulkCreateAdminUsers: jest.fn(),
    getAdminUsers: jest.fn(),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const mockedBulkCreateAdminUsers = jest.mocked(bulkCreateAdminUsers);
const mockedBulkCreateAdminPosts = jest.mocked(bulkCreateAdminPosts);
const mockedGetAdminUsers = jest.mocked(getAdminUsers);

describe('admin bulk creation modals', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects duplicate user emails before submitting a batch', async () => {
        render(<App><AdminBulkUserModal onClose={jest.fn()} onSaved={jest.fn()} /></App>);

        fireEvent.change(screen.getByLabelText('User 1 name'), { target: { value: 'Jane' } });
        fireEvent.change(screen.getByLabelText('User 1 email'), { target: { value: 'jane@example.com' } });
        fireEvent.change(screen.getByLabelText('User 1 password'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add row' }));
        fireEvent.change(screen.getByLabelText('User 2 name'), { target: { value: 'Second Jane' } });
        fireEvent.change(screen.getByLabelText('User 2 email'), { target: { value: 'JANE@example.com' } });
        fireEvent.change(screen.getByLabelText('User 2 password'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create 2 users' }));

        expect(await screen.findByText('Each email in the batch must be unique.')).toBeInTheDocument();
        expect(mockedBulkCreateAdminUsers).not.toHaveBeenCalled();
    });

    it('submits user rows and completes after successful creation', async () => {
        const onSaved = jest.fn();
        mockedBulkCreateAdminUsers.mockResolvedValue({ message: 'Users created', created: 1, users: [] });
        render(<App><AdminBulkUserModal onClose={jest.fn()} onSaved={onSaved} /></App>);

        fireEvent.change(screen.getByLabelText('User 1 name'), { target: { value: 'Jane' } });
        fireEvent.change(screen.getByLabelText('User 1 email'), { target: { value: 'jane@example.com' } });
        fireEvent.change(screen.getByLabelText('User 1 password'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('User 1 interests'), { target: { value: 'technology, music' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create 1 user' }));

        await waitFor(() => expect(mockedBulkCreateAdminUsers).toHaveBeenCalledWith([
            expect.objectContaining({ name: 'Jane', email: 'jane@example.com', interests: ['technology', 'music'] }),
        ]));
        expect(onSaved).toHaveBeenCalled();
    });

    it('loads valid authors and submits bulk post rows', async () => {
        const onSaved = jest.fn();
        mockedGetAdminUsers.mockResolvedValue({
            items: [{ _id: 'author-1', name: 'Jane', email: 'jane@example.com' } as AdminUser],
            pagination: { page: 1, limit: 100, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        });
        mockedBulkCreateAdminPosts.mockResolvedValue({ message: 'Posts created', created: 1, posts: [] });

        render(<App><AdminBulkPostModal onClose={jest.fn()} onSaved={onSaved} /></App>);

        await screen.findByRole('option', { name: 'Jane (jane@example.com)' });
        fireEvent.change(screen.getByLabelText('Post 1 author'), { target: { value: 'author-1' } });
        fireEvent.change(screen.getByLabelText('Post 1 title'), { target: { value: 'Getting Started' } });
        fireEvent.change(screen.getByLabelText('Post 1 category'), { target: { value: 'Technology' } });
        fireEvent.change(screen.getByLabelText('Post 1 content'), { target: { value: 'Content' } });
        fireEvent.change(screen.getByLabelText('Post 1 image'), { target: { value: 'data:image/png;base64,a' } });
        fireEvent.change(screen.getByLabelText('Post 1 tags'), { target: { value: 'typescript, api' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create 1 post' }));

        await waitFor(() => expect(mockedBulkCreateAdminPosts).toHaveBeenCalledWith([
            expect.objectContaining({ author: 'author-1', tags: ['typescript', 'api'], visibility: 'public' }),
        ]));
        expect(onSaved).toHaveBeenCalled();
    });
});
