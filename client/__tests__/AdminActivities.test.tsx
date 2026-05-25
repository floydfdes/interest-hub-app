import AdminActivitiesPage from '@/app/admin/activities/page';
import { getAdminActivities } from '@/app/api/api';
import { AdminActivitiesResponse } from '@/app/types/user';
import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    getAdminActivities: jest.fn(),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const mockedGetAdminActivities = jest.mocked(getAdminActivities);
const response: AdminActivitiesResponse = {
    items: [{
        _id: 'activity-1',
        actor: {
            _id: 'user-1',
            name: 'Floyd',
            email: 'floyd@example.com',
            profilePic: null,
            role: 'user',
        },
        type: 'post_liked',
        post: {
            _id: 'post-1',
            title: 'My post',
            image: '',
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        metadata: { source: 'feed' },
        createdAt: '2026-05-25T10:30:00.000Z',
        updatedAt: '2026-05-25T10:30:00.000Z',
    }],
    pagination: {
        page: 1,
        limit: 20,
        total: 21,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
    },
};

describe('AdminActivitiesPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetAdminActivities.mockResolvedValue(response);
    });

    it('renders activity, submits filters, paginates, and opens detail content', async () => {
        render(<App><AdminActivitiesPage /></App>);

        expect(await screen.findByText('Liked a post')).toBeInTheDocument();
        expect(screen.getByText('My post')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Filter activity type'), { target: { value: 'post_liked' } });
        fireEvent.change(screen.getByLabelText('Filter actor ID'), { target: { value: ' user-1 ' } });
        fireEvent.click(screen.getByRole('button', { name: /Apply/ }));

        await waitFor(() => expect(mockedGetAdminActivities).toHaveBeenCalledWith({
            page: 1,
            type: 'post_liked',
            actorId: 'user-1',
        }));

        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        await waitFor(() => expect(mockedGetAdminActivities).toHaveBeenCalledWith({
            page: 2,
            type: 'post_liked',
            actorId: 'user-1',
        }));

        fireEvent.click(screen.getByRole('button', { name: 'View activity by Floyd' }));
        expect(await screen.findByText('Mozilla/5.0')).toBeInTheDocument();
        expect(screen.getByText(/"source": "feed"/)).toBeInTheDocument();
    });
});
