'use client';

import { bulkCreateAdminUsers, getErrorMessage } from '@/app/api/api';
import { AdminBulkUserInput } from '@/app/types/user';
import { App } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface AdminBulkUserModalProps {
    onClose: () => void;
    onSaved: () => void;
}

type UserRow = AdminBulkUserInput & {
    key: number;
    interestText: string;
};

let nextUserRowKey = 1;

function newUserRow(): UserRow {
    return {
        key: nextUserRowKey++,
        name: '',
        email: '',
        password: '',
        role: 'user',
        profilePic: null,
        bio: '',
        interests: [],
        interestText: '',
        isBlocked: false,
    };
}

export default function AdminBulkUserModal({ onClose, onSaved }: AdminBulkUserModalProps) {
    const [rows, setRows] = useState<UserRow[]>([newUserRow()]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const { message } = App.useApp();

    const updateRow = <K extends keyof UserRow>(key: number, field: K, value: UserRow[K]) => {
        setRows((current) => current.map((row) => row.key === key ? { ...row, [field]: value } : row));
    };

    const removeRow = (key: number) => {
        setRows((current) => current.length === 1 ? current : current.filter((row) => row.key !== key));
    };

    const addRow = () => {
        if (rows.length >= 100) {
            setError('A batch can include at most 100 users.');
            return;
        }
        setError('');
        setRows((current) => [...current, newUserRow()]);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (rows.length > 100) {
            setError('A batch can include at most 100 users.');
            return;
        }

        const users = rows.map((row) => ({
            name: row.name.trim(),
            email: row.email.trim(),
            password: row.password.trim(),
            role: row.role,
            profilePic: row.profilePic?.trim() || null,
            bio: row.bio.trim(),
            interests: row.interestText.split(',').map((interest) => interest.trim()).filter(Boolean),
            isBlocked: row.isBlocked,
        }));
        if (users.some((user) => !user.name || !user.email || user.password.length < 6)) {
            setError('Every user needs a name, email, and password of at least 6 characters.');
            return;
        }

        const uniqueEmails = new Set(users.map((user) => user.email.toLowerCase()));
        if (uniqueEmails.size !== users.length) {
            setError('Each email in the batch must be unique.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const created = await bulkCreateAdminUsers(users);
            message.success(`${created.created} ${created.created === 1 ? 'user' : 'users'} created.`);
            onSaved();
            onClose();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to create users.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="surface max-h-[92vh] w-full max-w-6xl overflow-y-auto p-6 sm:p-7">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">Bulk add users</h2>
                        <p className="mt-1 text-sm text-slate-500">Create up to 100 accounts in one batch. No users are created when any email conflicts.</p>
                    </div>
                    <button type="button" onClick={addRow} disabled={saving || rows.length >= 100} className="secondary-button">
                        <Plus size={16} /> Add row
                    </button>
                </div>

                {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-600">{error}</p>}

                <div className="mt-6 space-y-4">
                    {rows.map((row, index) => (
                        <fieldset key={row.key} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <legend className="text-sm font-semibold text-slate-700">User {index + 1}</legend>
                                {rows.length > 1 && (
                                    <button type="button" aria-label={`Remove user ${index + 1}`} onClick={() => removeRow(row.key)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50">
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <label className="text-sm font-medium text-slate-700">
                                    Name
                                    <input aria-label={`User ${index + 1} name`} value={row.name} onChange={(event) => updateRow(row.key, 'name', event.target.value)} className="soft-input mt-2 w-full px-3 outline-none" />
                                </label>
                                <label className="text-sm font-medium text-slate-700">
                                    Email
                                    <input aria-label={`User ${index + 1} email`} type="email" value={row.email} onChange={(event) => updateRow(row.key, 'email', event.target.value)} className="soft-input mt-2 w-full px-3 outline-none" />
                                </label>
                                <label className="text-sm font-medium text-slate-700">
                                    Password
                                    <input aria-label={`User ${index + 1} password`} type="password" value={row.password} onChange={(event) => updateRow(row.key, 'password', event.target.value)} className="soft-input mt-2 w-full px-3 outline-none" />
                                </label>
                                <label className="text-sm font-medium text-slate-700">
                                    Role
                                    <select aria-label={`User ${index + 1} role`} value={row.role} onChange={(event) => updateRow(row.key, 'role', event.target.value as AdminBulkUserInput['role'])} className="soft-input mt-2 w-full px-3 outline-none">
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </label>
                                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                    Bio
                                    <input aria-label={`User ${index + 1} bio`} value={row.bio} onChange={(event) => updateRow(row.key, 'bio', event.target.value)} className="soft-input mt-2 w-full px-3 outline-none" />
                                </label>
                                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                    Interests
                                    <input aria-label={`User ${index + 1} interests`} value={row.interestText} onChange={(event) => updateRow(row.key, 'interestText', event.target.value)} placeholder="Technology, Music" className="soft-input mt-2 w-full px-3 outline-none" />
                                </label>
                                <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
                                    Profile picture URL
                                    <input aria-label={`User ${index + 1} profile picture`} value={row.profilePic || ''} onChange={(event) => updateRow(row.key, 'profilePic', event.target.value)} className="soft-input mt-2 w-full px-3 outline-none" />
                                </label>
                                <label className="flex items-end gap-2 pb-3 text-sm font-medium text-slate-700">
                                    <input type="checkbox" checked={row.isBlocked} onChange={(event) => updateRow(row.key, 'isBlocked', event.target.checked)} />
                                    Block account
                                </label>
                            </div>
                        </fieldset>
                    ))}
                </div>

                <div className="mt-7 flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="secondary-button">Cancel</button>
                    <button type="submit" disabled={saving} className="primary-button">{saving ? 'Creating...' : `Create ${rows.length} ${rows.length === 1 ? 'user' : 'users'}`}</button>
                </div>
            </form>
        </div>
    );
}
