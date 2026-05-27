import FollowRequestsPage from '@/app/profile/follow-requests/page';
import { acceptFollowRequest, getFollowRequests, rejectFollowRequest } from '@/app/api/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    acceptFollowRequest: jest.fn(),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    getFollowRequests: jest.fn(),
    rejectFollowRequest: jest.fn(),
}));

const mockedGetFollowRequests = jest.mocked(getFollowRequests);
const mockedAcceptFollowRequest = jest.mocked(acceptFollowRequest);
const mockedRejectFollowRequest = jest.mocked(rejectFollowRequest);

describe('FollowRequestsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetFollowRequests.mockResolvedValue({
            items: [{ _id: 'user-2', name: 'Jordan', profilePic: null }],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        });
        mockedAcceptFollowRequest.mockResolvedValue({ message: 'Follow request accepted' });
        mockedRejectFollowRequest.mockResolvedValue({ message: 'Follow request rejected' });
    });

    it('accepts a pending request and removes it from the list', async () => {
        render(<FollowRequestsPage />);
        expect(await screen.findByText('Jordan')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

        await waitFor(() => expect(mockedAcceptFollowRequest).toHaveBeenCalledWith('user-2'));
        expect(screen.queryByText('Jordan')).not.toBeInTheDocument();
    });

    it('rejects a pending request', async () => {
        render(<FollowRequestsPage />);
        await screen.findByText('Jordan');
        fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

        await waitFor(() => expect(mockedRejectFollowRequest).toHaveBeenCalledWith('user-2'));
    });
});
