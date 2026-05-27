import AdminReportsPage from '@/app/admin/reports/page';
import { applyAdminReportAction, getAdminReports, updateAdminReportStatus } from '@/app/api/api';
import { AdminReportsResponse } from '@/app/types/user';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    applyAdminReportAction: jest.fn(),
    getAdminReports: jest.fn(),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    updateAdminReportStatus: jest.fn(),
}));

const mockedGetAdminReports = jest.mocked(getAdminReports);
const mockedUpdateAdminReportStatus = jest.mocked(updateAdminReportStatus);
const mockedApplyAdminReportAction = jest.mocked(applyAdminReportAction);
const response: AdminReportsResponse = {
    items: [{
        _id: 'report-1',
        targetType: 'post',
        reason: 'harassment',
        details: 'Threatening language',
        status: 'pending',
        action: 'none',
        reporter: { _id: 'user-1', name: 'Floyd', profilePic: null },
        post: { _id: 'post-1', title: 'Reported post', image: '' },
        createdAt: '2026-05-27T10:30:00.000Z',
    }],
    pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
    },
};

describe('AdminReportsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetAdminReports.mockResolvedValue(response);
        mockedUpdateAdminReportStatus.mockResolvedValue(response.items[0]);
        mockedApplyAdminReportAction.mockResolvedValue(response.items[0]);
    });

    it('filters reports, starts review, and applies content moderation actions', async () => {
        render(<AdminReportsPage />);

        expect(await screen.findByText('Harassment post report')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Hide Content' })).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Filter report target type'), { target: { value: 'post' } });
        fireEvent.click(screen.getByRole('button', { name: /Apply filter/ }));

        await waitFor(() => expect(mockedGetAdminReports).toHaveBeenCalledWith({
            page: 1,
            status: 'pending',
            targetType: 'post',
        }));

        fireEvent.click(screen.getByRole('button', { name: 'Start Review' }));
        await waitFor(() => expect(mockedUpdateAdminReportStatus).toHaveBeenCalledWith('report-1', 'reviewing', ''));

        fireEvent.change(screen.getByLabelText('Moderation note'), { target: { value: 'Policy violation' } });
        fireEvent.click(screen.getByRole('button', { name: 'Hide Content' }));
        await waitFor(() => expect(mockedApplyAdminReportAction).toHaveBeenCalledWith('report-1', 'content_hidden', 'Policy violation'));
    });
});
