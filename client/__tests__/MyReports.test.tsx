import MyReportsPage from '@/app/profile/reports/page';
import { getMyReports } from '@/app/api/api';
import { MyReportsResponse } from '@/app/types/user';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    getMyReports: jest.fn(),
}));

const mockedGetMyReports = jest.mocked(getMyReports);
const response: MyReportsResponse = {
    items: [{
        _id: 'report-1',
        targetType: 'post',
        reason: 'spam',
        details: 'Repeated promotion',
        status: 'pending',
        action: 'none',
        post: { _id: 'post-1', title: 'Sales post', image: '' },
        createdAt: '2026-05-27T10:30:00.000Z',
    }],
    pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
    },
};

describe('MyReportsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.setItem('token', 'test-token');
        mockedGetMyReports.mockResolvedValue(response);
    });

    it('shows submitted reports and loads another page', async () => {
        render(<MyReportsPage />);

        expect(await screen.findByText('Spam post report')).toBeInTheDocument();
        expect(screen.getByText('Sales post')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

        await waitFor(() => expect(mockedGetMyReports).toHaveBeenCalledWith(2, 20));
    });

    it('does not load reports for a signed-out visitor', async () => {
        localStorage.clear();
        render(<MyReportsPage />);

        expect(await screen.findByText('Log in to see your reports.')).toBeInTheDocument();
        expect(mockedGetMyReports).not.toHaveBeenCalled();
    });
});
