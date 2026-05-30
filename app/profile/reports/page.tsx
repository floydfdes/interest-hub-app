'use client';

import { getErrorMessage, getMyReports } from '@/app/api/api';
import { Pagination, UserReport } from '@/app/types/user';
import { Empty, Skeleton } from 'antd';
import { format } from 'date-fns';
import { ArrowLeft, Flag } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const reasonLabels: Record<UserReport['reason'], string> = {
    spam: 'Spam',
    harassment: 'Harassment',
    hate_speech: 'Hate speech',
    violence: 'Violence',
    sexual_content: 'Sexual content',
    misinformation: 'Misinformation',
    impersonation: 'Impersonation',
    other: 'Other',
};

function reportTarget(report: UserReport) {
    if (report.post) return report.post.title;
    if (report.comment) return report.comment.content;
    return report.targetUser?.name || report.user?.name || report.targetType;
}

export default function MyReportsPage() {
    const [reports, setReports] = useState<UserReport[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const loadReports = async () => {
            if (!localStorage.getItem('token')) {
                if (!cancelled) {
                    setError('Log in to see your reports.');
                    setLoading(false);
                }
                return;
            }
            try {
                const response = await getMyReports();
                if (!cancelled) {
                    setReports(response.items);
                    setPagination(response.pagination);
                }
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load your reports.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void loadReports();
        return () => {
            cancelled = true;
        };
    }, []);

    const loadMore = async () => {
        if (!pagination?.hasNextPage) return;
        setLoadingMore(true);
        setError('');
        try {
            const response = await getMyReports(pagination.page + 1, pagination.limit);
            setReports((current) => [...current, ...response.items]);
            setPagination(response.pagination);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load more reports.'));
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <div className="shell-container max-w-3xl">
            <Link href="/profile/settings" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <ArrowLeft size={15} /> Back to settings
            </Link>
            <header className="mb-7">
                <span className="eyebrow"><Flag size={12} /> Profile</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">My reports</h1>
                <p className="mt-2 text-slate-500">Review the reports you have submitted for moderation.</p>
            </header>

            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}
            {loading ? (
                <div className="surface p-6"><Skeleton active paragraph={{ rows: 5 }} /></div>
            ) : reports.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="No reports submitted" /></div>
            ) : (
                <div className="space-y-3">
                    {reports.map((report) => (
                        <article key={report._id} className="surface p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold capitalize text-slate-900">
                                        {reasonLabels[report.reason]} {report.targetType} report
                                    </p>
                                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{reportTarget(report)}</p>
                                </div>
                                <span className="tag-pill capitalize">{report.status}</span>
                            </div>
                            {report.details && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{report.details}</p>}
                            {report.createdAt && (
                                <p className="mt-4 text-xs text-slate-400">{format(new Date(report.createdAt), 'MMM d, yyyy, h:mm a')}</p>
                            )}
                        </article>
                    ))}
                    {pagination?.hasNextPage && (
                        <button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="secondary-button mx-auto flex">
                            {loadingMore ? 'Loading...' : 'Load more'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
