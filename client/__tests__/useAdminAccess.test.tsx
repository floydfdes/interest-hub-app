import { ApiError, checkAdminAccess } from '@/app/api/api';
import { useAdminAccess } from '@/app/hooks/useAdminAccess';
import { render, waitFor } from '@testing-library/react';

const push = jest.fn();

jest.mock('@/app/api/api', () => {
    const actual = jest.requireActual('@/app/api/api');
    return {
        ...actual,
        checkAdminAccess: jest.fn(),
    };
});

jest.mock('@/app/hooks/useCurrentUser', () => ({
    notifyAuthChanged: jest.fn(),
    useCurrentUser: () => ({ _id: 'user-1', name: 'Alex' }),
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push }),
}));

const mockedCheckAdminAccess = jest.mocked(checkAdminAccess);

function AccessProbe() {
    useAdminAccess();
    return null;
}

describe('useAdminAccess', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.setItem('token', 'expired-token');
        localStorage.setItem('user', JSON.stringify({ _id: 'user-1' }));
    });

    it('uses the logout and login redirect flow when the admin check is unauthorized', async () => {
        mockedCheckAdminAccess.mockRejectedValue(new ApiError('Unauthorized', 401));

        render(<AccessProbe />);

        await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
    });
});
