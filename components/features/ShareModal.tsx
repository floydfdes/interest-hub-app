'use client';

import { createShare, getErrorMessage, searchUsers } from '@/app/api/api';
import { IUser, ShareTargetType } from '@/app/types/user';
import { App, Avatar } from 'antd';
import { Search, Send } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface ShareModalProps {
    targetType: ShareTargetType;
    targetId: string;
    targetLabel?: string;
    currentUserId?: string;
    onClose: () => void;
}

export default function ShareModal({ targetType, targetId, targetLabel, currentUserId, onClose }: ShareModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<IUser[]>([]);
    const [recipient, setRecipient] = useState<IUser | null>(null);
    const [note, setNote] = useState('');
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const { message } = App.useApp();

    const searchRecipients = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSearching(true);
        setError('');
        try {
            const users = await searchUsers(query.trim());
            setResults(users.filter((user) => user._id !== currentUserId));
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to search users.'));
        } finally {
            setSearching(false);
        }
    };

    const submitShare = async () => {
        if (!recipient) {
            setError('Choose someone to share with.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await createShare({
                recipientId: recipient._id,
                targetType,
                targetId,
                ...(note.trim() ? { message: note.trim() } : {}),
            });
            message.success(`${targetType === 'post' ? 'Post' : targetType === 'comment' ? 'Comment' : 'Profile'} shared with ${recipient.name}`);
            onClose();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to share.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm">
            <div className="surface w-full max-w-md p-6" role="dialog" aria-modal="true" aria-label={`Share ${targetType}`}>
                <h2 className="text-xl font-semibold text-slate-900">Share {targetType}</h2>
                {targetLabel && <p className="mt-1 truncate text-sm text-slate-500">{targetLabel}</p>}

                <form onSubmit={searchRecipients} className="mt-6 flex gap-2">
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="soft-input min-w-0 flex-1 px-4 text-sm outline-none"
                        placeholder="Search people by name or interest"
                    />
                    <button type="submit" disabled={searching} className="secondary-button">
                        <Search size={15} />
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                </form>

                <div className="mt-4 max-h-48 space-y-2 overflow-y-auto pr-1">
                    {results.map((user) => (
                        <button
                            key={user._id}
                            type="button"
                            onClick={() => setRecipient(user)}
                            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                                recipient?._id === user._id
                                    ? 'border-[#9CC4E4] bg-[#E9F2F9]'
                                    : 'border-slate-100 bg-white hover:bg-slate-50'
                            }`}
                        >
                            <Avatar src={user.profilePic || null}>{user.name.charAt(0)}</Avatar>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-slate-800">{user.name}</span>
                                {user.bio && <span className="block truncate text-xs text-slate-500">{user.bio}</span>}
                            </span>
                        </button>
                    ))}
                </div>

                <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="share-message">
                    Message <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                    id="share-message"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    className="soft-input mt-2 w-full resize-none px-4 py-3 text-sm outline-none"
                    placeholder={targetType === 'post' ? 'Check this out' : targetType === 'comment' ? 'Read this comment' : 'You may like this profile'}
                />

                {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}

                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={onClose} disabled={saving} className="secondary-button">Cancel</button>
                    <button type="button" onClick={() => void submitShare()} disabled={saving || !recipient} className="primary-button">
                        <Send size={15} />
                        {saving ? 'Sharing...' : 'Share'}
                    </button>
                </div>
            </div>
        </div>
    );
}
