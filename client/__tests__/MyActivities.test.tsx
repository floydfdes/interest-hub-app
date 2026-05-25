import MyActivitiesPage from '@/app/profile/activities/page';
import { getMyActivities } from '@/app/api/api';
import { MyActivitiesResponse } from '@/app/types/user';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    getMyActivities: jest.fn(),
}));

const mockedGetMyActivities = jest.mocked(getMyActivities);
const response: MyActivitiesResponse = {
    items: [{
        _id: 'activity-1',
        actor: {
            _id: 'user-1',
            name: 'Floyd',
            profilePic: null,
        },
        type: 'post_liked',
        post: {
            _id: 'post-1',
            title: 'A saved thought',
            image: '',
        },
        createdAt: '2026-05-25T10:30:00.000Z',
        updatedAt: '2026-05-25T10:30:00.000Z',
    }],
    pagination: {
        page: 1,
        limit: 20,
        total: 22,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
    },
};

describe('MyActivitiesPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.setItem('token', 'test-token');
        mockedGetMyActivities.mockResolvedValue(response);
    });

    it('shows the private activity timeline, filters it, and loads more', async () => {
        render(<MyActivitiesPage />);

        expect(await screen.findByText('Liked a post')).toBeInTheDocument();
        expect(screen.getByText('A saved thought')).toBeInTheDocument();
        expect(mockedGetMyActivities).toHaveBeenNthCalledWith(1);

        fireEvent.click(screen.getByRole('button', { name: 'Following' }));
        await waitFor(() => expect(mockedGetMyActivities).toHaveBeenCalledWith({ type: 'user_followed' }));

        fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
        await waitFor(() => expect(mockedGetMyActivities).toHaveBeenCalledWith({
            page: 2,
            limit: 20,
            type: 'user_followed',
        }));
    });

    it('does not fetch activity while signed out', async () => {
        localStorage.clear();

        render(<MyActivitiesPage />);

        expect(await screen.findByText('Log in to see your activity.')).toBeInTheDocument();
        expect(mockedGetMyActivities).not.toHaveBeenCalled();
    });
});
