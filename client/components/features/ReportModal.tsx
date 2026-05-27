'use client';

import { getErrorMessage, submitReport } from '@/app/api/api';
import { ReportReason, ReportTargetType } from '@/app/types/user';
import { App } from 'antd';
import { FormEvent, useState } from 'react';

const reportReasons: Array<{ value: ReportReason; label: string }> = [
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'hate_speech', label: 'Hate speech' },
    { value: 'violence', label: 'Violence' },
    { value: 'sexual_content', label: 'Sexual content' },
    { value: 'misinformation', label: 'Misinformation' },
    { value: 'impersonation', label: 'Impersonation' },
    { value: 'other', label: 'Other' },
];

interface ReportModalProps {
    targetType: ReportTargetType;
    targetId: string;
    targetLabel?: string;
    onClose: () => void;
}

export default function ReportModal({ targetType, targetId, targetLabel, onClose }: ReportModalProps) {
    const [reason, setReason] = useState<ReportReason>('spam');
    const [details, setDetails] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const { message } = App.useApp();

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            await submitReport({
                targetType,
                targetId,
                reason,
                ...(details.trim() ? { details: details.trim() } : {}),
            });
            message.success('Report submitted');
            onClose();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to submit report.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm">
            <form onSubmit={submit} className="surface w-full max-w-md p-6" aria-label="Report content">
                <h2 className="text-xl font-semibold text-slate-900">Report {targetType}</h2>
                {targetLabel && <p className="mt-1 truncate text-sm text-slate-500">{targetLabel}</p>}

                <label className="mt-6 block text-sm font-medium text-slate-700" htmlFor="report-reason">
                    Reason
                </label>
                <select
                    id="report-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value as ReportReason)}
                    className="soft-input mt-2 w-full px-4 text-sm outline-none"
                >
                    {reportReasons.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>

                <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="report-details">
                    Additional details <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                    id="report-details"
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    rows={4}
                    className="soft-input mt-2 w-full resize-none px-4 py-3 text-sm outline-none"
                    placeholder="Tell us what happened."
                />

                {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}

                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={onClose} disabled={saving} className="secondary-button">Cancel</button>
                    <button type="submit" disabled={saving} className="primary-button">
                        {saving ? 'Submitting...' : 'Submit report'}
                    </button>
                </div>
            </form>
        </div>
    );
}
