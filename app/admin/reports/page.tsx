'use client';

import { applyAdminReportAction, getAdminReports, getErrorMessage, updateAdminReportStatus } from '@/app/api/api';
import { AdminReportsResponse, ReportAction, ReportStatus, ReportTargetType, UserReport } from '@/app/types/user';
import { Empty, Skeleton } from 'antd';
import { format } from 'date-fns';
import { Flag, Search } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

const statuses: ReportStatus[] = ['pending', 'reviewing', 'resolved', 'dismissed'];

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

const actionLabels: Record<ReportAction, string> = {
    none: 'No action',
    content_hidden: 'Content hidden',
    content_removed: 'Content removed',
    user_suspended: 'User suspended',
};

function reportedTarget(report: UserReport) {
    if (report.post) return report.post.title;
    if (report.comment) return report.comment.content;
    return report.targetUser?.name || report.user?.name || '-';
}

function reporterName(report: UserReport) {
    return report.reporter?.name || 'Unknown reporter';
}

export default function AdminReportsPage() {
    const [response, setResponse] = useState<AdminReportsResponse | null>(null);
    const [status, setStatus] = useState<ReportStatus>('pending');
    const [targetType, setTargetType] = useState<ReportTargetType | ''>('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState('');
    const [error, setError] = useState('');

    const loadReports = async (
        page = 1,
        nextStatus: ReportStatus = status,
        nextTargetType: ReportTargetType | '' = targetType
    ) => {
        setLoading(true);
        setError('');
        try {
            setResponse(await getAdminReports({
                page,
                status: nextStatus,
                targetType: nextTargetType || undefined,
            }));
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load reports.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        const loadInitialReports = async () => {
            try {
                const reports = await getAdminReports({ status: 'pending' });
                if (!cancelled) setResponse(reports);
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load reports.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void loadInitialReports();
        return () => {
            cancelled = true;
        };
    }, []);

    const selectStatus = (nextStatus: ReportStatus) => {
        setStatus(nextStatus);
        void loadReports(1, nextStatus);
    };

    const submitFilter = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void loadReports();
    };

    const updateStatus = async (reportId: string, nextStatus: Exclude<ReportStatus, 'pending'>) => {
        setUpdatingId(reportId);
        setError('');
        try {
            await updateAdminReportStatus(reportId, nextStatus, note);
            await loadReports(response?.pagination.page || 1);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to update report status.'));
        } finally {
            setUpdatingId('');
        }
    };

    const applyAction = async (reportId: string, action: Exclude<ReportAction, 'none'>) => {
        setUpdatingId(reportId);
        setError('');
        try {
            await applyAdminReportAction(reportId, action, note);
            await loadReports(response?.pagination.page || 1);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to apply moderation action.'));
        } finally {
            setUpdatingId('');
        }
    };

    return (
        <div>
            <header className="mb-7">
                <span className="eyebrow"><Flag size={12} /> Administration</span>
                <h1 className="gradient-heading mt-4 text-4xl font-bold">Reports</h1>
                <p className="mt-2 text-slate-500">Review reported content and accounts, then record a moderation decision.</p>
            </header>

            <div className="surface mb-5 flex flex-wrap gap-2 p-3" aria-label="Report status filters">
                {statuses.map((option) => (
                    <button
                        key={option}
                        type="button"
                        aria-pressed={status === option}
                        onClick={() => selectStatus(option)}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
                            status === option ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <form onSubmit={submitFilter} className="surface mb-6 grid gap-3 p-4 sm:grid-cols-[15rem_1fr_auto]">
                <select
                    aria-label="Filter report target type"
                    value={targetType}
                    onChange={(event) => setTargetType(event.target.value as ReportTargetType | '')}
                    className="soft-input px-4 text-sm text-slate-600 outline-none"
                >
                    <option value="">All target types</option>
                    <option value="post">Posts</option>
                    <option value="comment">Comments</option>
                    <option value="user">Users</option>
                </select>
                <input
                    aria-label="Moderation note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Optional note attached to your next action"
                    className="soft-input min-w-0 px-4 text-sm outline-none"
                />
                <button type="submit" className="primary-button" disabled={loading}><Search size={16} /> Apply filter</button>
            </form>

            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}

            {loading ? (
                <div className="surface p-6"><Skeleton active paragraph={{ rows: 7 }} /></div>
            ) : !response || response.items.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="No reports found" /></div>
            ) : (
                <>
                    <div className="space-y-4">
                        {response.items.map((report) => (
                            <article key={report._id} className="surface p-5">
                                <div className="flex flex-wrap justify-between gap-4">
                                    <div>
                                        <p className="font-semibold capitalize text-slate-900">{reasonLabels[report.reason]} {report.targetType} report</p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Reported by {reporterName(report)}{report.createdAt ? ` on ${format(new Date(report.createdAt), 'MMM d, yyyy, h:mm a')}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="tag-pill capitalize">{report.status}</span>
                                        <span className="tag-pill">{actionLabels[report.action]}</span>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                                    <p><span className="font-semibold text-slate-700">Target:</span> <span className="text-slate-600">{reportedTarget(report)}</span></p>
                                    <p><span className="font-semibold text-slate-700">Type:</span> <span className="capitalize text-slate-600">{report.targetType}</span></p>
                                    {report.details && <p className="sm:col-span-2"><span className="font-semibold text-slate-700">Details:</span> <span className="text-slate-600">{report.details}</span></p>}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {report.status === 'pending' && (
                                        <button type="button" onClick={() => void updateStatus(report._id, 'reviewing')} disabled={updatingId === report._id} className="secondary-button !min-h-0 !py-2">
                                            Start Review
                                        </button>
                                    )}
                                    {report.status !== 'dismissed' && report.status !== 'resolved' && (
                                        <button type="button" onClick={() => void updateStatus(report._id, 'dismissed')} disabled={updatingId === report._id} className="secondary-button !min-h-0 !py-2">
                                            Dismiss
                                        </button>
                                    )}
                                    {report.targetType !== 'user' && (
                                        <>
                                            <button type="button" onClick={() => void applyAction(report._id, 'content_hidden')} disabled={updatingId === report._id} className="secondary-button !min-h-0 !py-2">
                                                Hide Content
                                            </button>
                                            <button type="button" onClick={() => void applyAction(report._id, 'content_removed')} disabled={updatingId === report._id} className="secondary-button !min-h-0 !py-2 !text-rose-600">
                                                Remove Content
                                            </button>
                                        </>
                                    )}
                                    <button type="button" onClick={() => void applyAction(report._id, 'user_suspended')} disabled={updatingId === report._id} className="secondary-button !min-h-0 !py-2 !text-rose-600">
                                        Suspend User
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-500">
                        <span>{response.pagination.total} reports</span>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => void loadReports(response.pagination.page - 1)} disabled={!response.pagination.hasPreviousPage} className="secondary-button !min-h-0 !py-2 disabled:opacity-50">Previous</button>
                            <span>Page {response.pagination.page} of {response.pagination.totalPages || 1}</span>
                            <button type="button" onClick={() => void loadReports(response.pagination.page + 1)} disabled={!response.pagination.hasNextPage} className="secondary-button !min-h-0 !py-2 disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
