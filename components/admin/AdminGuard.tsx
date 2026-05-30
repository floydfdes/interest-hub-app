'use client';

import { useAdminAccess } from '@/app/hooks/useAdminAccess';
import { Skeleton } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { isAdmin, loading, forbidden, error } = useAdminAccess();
    const router = useRouter();

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            router.push('/login');
        }
    }, [router]);

    if (loading) {
        return (
            <div className="shell-container max-w-4xl">
                <div className="surface p-7"><Skeleton active paragraph={{ rows: 5 }} /></div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="surface shell-container max-w-lg p-10 text-center">
                <h1 className="text-2xl font-semibold text-slate-900">
                    {forbidden ? 'Page not available' : 'Admin access unavailable'}
                </h1>
                <p className="mt-3 text-slate-500">
                    {error || (forbidden ? 'You do not have access to this area.' : 'Sign in with an authorized account to continue.')}
                </p>
                <Link href="/" className="secondary-button mt-7">Return home</Link>
            </div>
        );
    }

    return children;
}
