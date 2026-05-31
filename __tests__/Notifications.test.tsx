import NotificationsPage from '@/app/notifications/page';
import { clearAllNotifications, clearReadNotifications, deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead } from '@/app/api/api';
import { NotificationsResponse } from '@/app/types/user';
import { Modal } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const push = jest.fn();

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push }),
}));

jest.mock('@/app/api/api', () => ({
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    clearAllNotifications: jest.fn(),
    clearReadNotifications: jest.fn(),
    deleteNotification: jest.fn(),
    getNotifications: jest.fn(),
    markAllNotificationsRead: jest.fn(),
    markNotificationRead: jest.fn(),
}));

const mockedClearAllNotifications = jest.mocked(clearAllNotifications);
const mockedClearReadNotifications = jest.mocked(clearReadNotifications);
const mockedDeleteNotification = jest.mocked(deleteNotification);
const mockedGetNotifications = jest.mocked(getNotifications);
const mockedMarkNotificationRead = jest.mocked(markNotificationRead);
const mockedMarkAllNotificationsRead = jest.mocked(markAllNotificationsRead);

const firstPage: NotificationsResponse = {
    items: [{
        _id: 'notification-1',
        type: 'post_liked',
        title: 'New like',
        actor: { _id: 'user-2', name: 'Alex', profilePic: null },
        message: 'Someone liked your post.',
        post: { _id: 'post-1', title: 'A thoughtful post', image: '' },
        isRead: false,
        createdAt: '2026-05-30T10:30:00.000Z',
        updatedAt: '2026-05-30T10:30:00.000Z',
    }],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 2, hasNextPage: true, hasPreviousPage: false },
};

const secondPage: NotificationsResponse = {
    items: [{
        _id: 'notification-2',
        type: 'user_followed',
        message: 'Mira followed you.',
        targetUser: { _id: 'user-2', name: 'Mira', profilePic: null },
        isRead: true,
        createdAt: '2026-05-30T11:30:00.000Z',
        updatedAt: '2026-05-30T11:30:00.000Z',
    }],
    pagination: { page: 2, limit: 20, total: 2, totalPages: 2, hasNextPage: false, hasPreviousPage: true },
};

describe('NotificationsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedClearAllNotifications.mockReset();
        mockedClearReadNotifications.mockReset();
        mockedDeleteNotification.mockReset();
        mockedGetNotifications.mockReset();
        mockedMarkNotificationRead.mockReset();
        mockedMarkAllNotificationsRead.mockReset();
        localStorage.setItem('token', 'test-token');
        mockedClearAllNotifications.mockResolvedValue({ deleted: 1 });
        mockedClearReadNotifications.mockResolvedValue({ deleted: 1 });
        mockedDeleteNotification.mockResolvedValue({ message: 'Notification deleted' });
        mockedGetNotifications.mockResolvedValue(firstPage);
        mockedMarkNotificationRead.mockResolvedValue({ message: 'Notification marked as read' });
        mockedMarkAllNotificationsRead.mockResolvedValue({ message: 'Notifications marked as read' });
    });

    it('shows notifications and marks one read before opening it', async () => {
        render(<NotificationsPage />);

        expect(await screen.findByText('Alex liked your post.')).toBeInTheDocument();
        expect(screen.getByText('1 unread')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Alex liked your post/i }));

        await waitFor(() => expect(mockedMarkNotificationRead).toHaveBeenCalledWith('notification-1'));
        expect(push).toHaveBeenCalledWith('/posts/post-1');
    });

    it('marks all notifications as read and loads more', async () => {
        mockedGetNotifications.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);

        render(<NotificationsPage />);

        fireEvent.click(await screen.findByRole('button', { name: 'Mark all as read' }));
        await waitFor(() => expect(mockedMarkAllNotificationsRead).toHaveBeenCalled());

        fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
        await waitFor(() => expect(mockedGetNotifications).toHaveBeenCalledWith(2, 20));
        expect(await screen.findByText('Mira followed you.')).toBeInTheDocument();
    });


    it('deletes one notification and clears read notifications', async () => {
        mockedGetNotifications.mockResolvedValueOnce(firstPage).mockResolvedValueOnce({
            items: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
        }).mockResolvedValueOnce(firstPage);

        render(<NotificationsPage />);

        fireEvent.click(await screen.findByRole('button', { name: 'Delete notification notification-1' }));
        await waitFor(() => expect(mockedDeleteNotification).toHaveBeenCalledWith('notification-1'));

        await waitFor(() => expect(screen.getByText('No notifications yet')).toBeInTheDocument());
    });

    it('confirms before clearing all notifications', async () => {
        mockedGetNotifications.mockResolvedValueOnce(firstPage).mockResolvedValueOnce({
            items: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
        });
        const confirmSpy = jest.spyOn(Modal, 'confirm').mockImplementation((config) => {
            void config.onOk?.();
            return { destroy: jest.fn(), update: jest.fn() } as ReturnType<typeof Modal.confirm>;
        });

        render(<NotificationsPage />);

        fireEvent.click(await screen.findByRole('button', { name: 'Clear all' }));

        expect(confirmSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Clear all notifications?' }));
        await waitFor(() => expect(mockedClearAllNotifications).toHaveBeenCalled());
        await waitFor(() => expect(mockedGetNotifications).toHaveBeenCalledTimes(2));
        confirmSpy.mockRestore();
    });


    it('treats isRead notifications as read', async () => {
        mockedGetNotifications.mockResolvedValue({
            items: [{
                _id: 'notification-read',
                type: 'user_followed',
                actor: { _id: 'user-3', name: 'John Doe', profilePic: null },
                message: 'Someone followed you.',
                isRead: true,
                createdAt: '2026-05-30T10:30:00.000Z',
                updatedAt: '2026-05-30T10:30:00.000Z',
            }],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        });

        render(<NotificationsPage />);

        expect(await screen.findByText('John Doe followed you.')).toBeInTheDocument();
        expect(screen.getByText('0 unread')).toBeInTheDocument();
        expect(screen.queryByLabelText('Unread')).not.toBeInTheDocument();
    });

    it('does not fetch notifications while signed out', async () => {
        localStorage.clear();

        render(<NotificationsPage />);

        expect(await screen.findByText('Log in to see your notifications.')).toBeInTheDocument();
        expect(mockedGetNotifications).not.toHaveBeenCalled();
    });
});
