'use client';

import { ApiError, checkAdminAccess } from '@/app/api/api';
import { notifyAuthChanged, useCurrentUser } from '@/app/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminAccessState {
    isAdmin: boolean;
    loading: boolean;
    forbidden: boolean;
    error: string;
    verifiedUserId: string | null;
}

export function useAdminAccess(): AdminAccessState {
    const user = useCurrentUser();
    const userId = user?._id || null;
    const router = useRouter();
    const [state, setState] = useState<AdminAccessState>({
        isAdmin: false,
        loading: Boolean(user),
        forbidden: false,
        error: '',
        verifiedUserId: null,
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!userId || !token) return;

        let cancelled = false;
        const loadAccess = async () => {
            try {
                const response = await checkAdminAccess();
                if (!cancelled) {
                    setState({
                        isAdmin: response.isAdmin,
                        loading: false,
                        forbidden: !response.isAdmin,
                        error: '',
                        verifiedUserId: userId,
                    });
                }
            } catch (error: unknown) {
                if (cancelled) return;

                if (error instanceof ApiError && error.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    notifyAuthChanged();
                    router.push('/login');
                    setState({ isAdmin: false, loading: false, forbidden: false, error: '', verifiedUserId: null });
                    return;
                }

                if (error instanceof ApiError && error.status === 403) {
                    setState({ isAdmin: false, loading: false, forbidden: true, error: '', verifiedUserId: userId });
                    return;
                }

                setState({
                    isAdmin: false,
                    loading: false,
                    forbidden: false,
                    error: 'Unable to verify admin access.',
                    verifiedUserId: userId,
                });
            }
        };

        void loadAccess();
        return () => {
            cancelled = true;
        };
    }, [router, userId]);

    if (!userId) {
        return { isAdmin: false, loading: false, forbidden: false, error: '', verifiedUserId: null };
    }

    if (state.verifiedUserId !== userId) {
        return { isAdmin: false, loading: true, forbidden: false, error: '', verifiedUserId: null };
    }

    return state;
}
