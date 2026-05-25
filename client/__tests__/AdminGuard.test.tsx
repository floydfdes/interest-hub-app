import { getAdminDashboard } from '@/app/api/api';
import { useAdminAccess } from '@/app/hooks/useAdminAccess';
import AdminGuard from '@/components/admin/AdminGuard';
import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';

jest.mock('@/app/api/api', () => ({
    getAdminDashboard: jest.fn(),
}));

jest.mock('@/app/hooks/useAdminAccess', () => ({
    useAdminAccess: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
}));

const mockedUseAdminAccess = jest.mocked(useAdminAccess);
const mockedGetAdminDashboard = jest.mocked(getAdminDashboard);

function PrivilegedChild() {
    useEffect(() => {
        void getAdminDashboard();
    }, []);
    return <p>Admin dashboard child</p>;
}

describe('AdminGuard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.setItem('token', 'token');
    });

    it('does not mount privileged children when access is forbidden', () => {
        mockedUseAdminAccess.mockReturnValue({ isAdmin: false, loading: false, forbidden: true, error: '', verifiedUserId: 'user-1' });

        render(<AdminGuard><PrivilegedChild /></AdminGuard>);

        expect(screen.getByText('Page not available')).toBeInTheDocument();
        expect(mockedGetAdminDashboard).not.toHaveBeenCalled();
    });

    it('renders privileged children after access succeeds', () => {
        mockedUseAdminAccess.mockReturnValue({ isAdmin: true, loading: false, forbidden: false, error: '', verifiedUserId: 'user-1' });
        mockedGetAdminDashboard.mockResolvedValue({} as never);

        render(<AdminGuard><PrivilegedChild /></AdminGuard>);

        expect(screen.getByText('Admin dashboard child')).toBeInTheDocument();
        expect(mockedGetAdminDashboard).toHaveBeenCalledTimes(1);
    });
});
