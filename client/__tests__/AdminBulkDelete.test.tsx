import {
    bulkDeleteAdminComments,
    bulkDeleteAdminUsers,
    getAdminPost,
    getAdminUsers,
} from '@/app/api/api';
import { AdminUser, IPost } from '@/app/types/user';
import AdminPostDetailPage from '@/app/admin/posts/[id]/page';
import AdminUsersPage from '@/app/admin/users/page';
import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Swal from 'sweetalert2';

jest.mock('@/app/api/api', () => ({
    blockAdminUser: jest.fn(),
    bulkDeleteAdminComments: jest.fn(),
    bulkDeleteAdminUsers: jest.fn(),
    deleteAdminComment: jest.fn(),
    deleteAdminPost: jest.fn(),
    deleteAdminReply: jest.fn(),
    deleteAdminUser: jest.fn(),
    getAdminPost: jest.fn(),
    getAdminUsers: jest.fn(),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    unblockAdminUser: jest.fn(),
}));

jest.mock('@/app/hooks/useCurrentUser', () => ({
    useCurrentUser: () => ({ _id: 'admin-1', name: 'Current Admin' }),
}));

jest.mock('next/navigation', () => ({
    useParams: () => ({ id: 'post-1' }),
    useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('sweetalert2', () => ({
    fire: jest.fn(),
}));

const mockedGetAdminUsers = jest.mocked(getAdminUsers);
const mockedBulkDeleteAdminUsers = jest.mocked(bulkDeleteAdminUsers);
const mockedGetAdminPost = jest.mocked(getAdminPost);
const mockedBulkDeleteAdminComments = jest.mocked(bulkDeleteAdminComments);
const mockedSwal = jest.mocked(Swal.fire);

describe('admin bulk deletion controls', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedSwal.mockResolvedValue({ isConfirmed: true } as never);
    });

    it('prevents self-selection and bulk deletes selected users', async () => {
        mockedGetAdminUsers.mockResolvedValue({
            users: [
                { _id: 'admin-1', name: 'Current Admin', email: 'admin@example.com' } as AdminUser,
                { _id: 'user-2', name: 'Jordan', email: 'jordan@example.com' } as AdminUser,
            ],
            total: 2,
            page: 1,
            limit: 20,
        });
        mockedBulkDeleteAdminUsers.mockResolvedValue({ message: 'Users deleted', requested: 1, deleted: 1 });

        render(<App><AdminUsersPage /></App>);

        expect(await screen.findByText('Jordan')).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Select Current Admin' })).toBeDisabled();
        fireEvent.click(screen.getByRole('checkbox', { name: 'Select Jordan' }));
        fireEvent.click(screen.getByRole('button', { name: /Delete selected/ }));

        await waitFor(() => expect(mockedBulkDeleteAdminUsers).toHaveBeenCalledWith(['user-2']));
    });

    it('bulk deletes selected top-level comments only', async () => {
        mockedGetAdminPost.mockResolvedValue({
            _id: 'post-1',
            title: 'Moderated post',
            content: 'Post content',
            author: { _id: 'author-1', name: 'Author', profilePic: '' },
            comments: [{
                _id: 'comment-1',
                user: { _id: 'user-2', name: 'Reader', profilePic: '' },
                content: 'Comment',
                replies: [{ _id: 'reply-1', user: { _id: 'user-3', name: 'Reply Author', profilePic: '' }, content: 'Reply', likes: [], createdAt: '' }],
                likes: [],
                post: 'post-1',
                createdAt: '',
                updatedAt: '',
            }],
            likes: [],
            category: 'Design',
            visibility: 'public',
            image: '',
            tags: [],
            viewCount: 0,
            sharedFrom: null,
            isEdited: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } as IPost);
        mockedBulkDeleteAdminComments.mockResolvedValue({ message: 'Comments deleted', requested: 1, deleted: 1 });

        render(<App><AdminPostDetailPage /></App>);

        fireEvent.click(await screen.findByRole('checkbox', { name: 'Select comment by Reader' }));
        fireEvent.click(screen.getByRole('button', { name: /Delete selected comments/ }));

        await waitFor(() => expect(mockedBulkDeleteAdminComments).toHaveBeenCalledWith(['comment-1']));
    });
});
