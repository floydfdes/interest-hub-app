import NotificationsPage from '@/app/notifications/page';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/app/api/api';
import { NotificationsResponse } from '@/app/types/user';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const push = jest.fn();

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push }),
}));

jest.mock('@/app/api/api', () => ({
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    getNotifications: jest.fn(),
    markAllNotificationsRead: jest.fn(),
    markNotificationRead: jest.fn(),
}));

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
        read: false,
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
        read: true,
        createdAt: '2026-05-30T11:30:00.000Z',
        updatedAt: '2026-05-30T11:30:00.000Z',
    }],
    pagination: { page: 2, limit: 20, total: 2, totalPages: 2, hasNextPage: false, hasPreviousPage: true },
};

describe('NotificationsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.setItem('token', 'test-token');
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

    it('does not fetch notifications while signed out', async () => {
        localStorage.clear();

        render(<NotificationsPage />);

        expect(await screen.findByText('Log in to see your notifications.')).toBeInTheDocument();
        expect(mockedGetNotifications).not.toHaveBeenCalled();
    });
});
