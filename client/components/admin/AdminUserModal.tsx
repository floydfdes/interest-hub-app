'use client';

import { createAdminUser, getErrorMessage, updateAdminUser } from '@/app/api/api';
import { AdminUser, AdminUserInput, AdminUserUpdateInput } from '@/app/types/user';
import { App } from 'antd';
import { useState } from 'react';

interface AdminUserModalProps {
    user: AdminUser | null;
    onClose: () => void;
    onSaved: () => void;
}

function initialValues(user: AdminUser | null): AdminUserInput {
    return {
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        role: user?.role || 'user',
        profilePic: user?.profilePic || null,
        bio: user?.bio || '',
        interests: user?.interests || [],
        isBlocked: user?.isBlocked || false,
    };
}

function changedValues(values: AdminUserInput, original: AdminUser): AdminUserUpdateInput {
    const changes: AdminUserUpdateInput = {};
    if (values.name !== original.name) changes.name = values.name;
    if (values.email !== original.email) changes.email = values.email;
    if (values.password) changes.password = values.password;
    if (values.role !== original.role) changes.role = values.role;
    if (values.profilePic !== original.profilePic) changes.profilePic = values.profilePic;
    if (values.bio !== original.bio) changes.bio = values.bio;
    if (values.interests.join('|') !== (original.interests || []).join('|')) changes.interests = values.interests;
    if (values.isBlocked !== original.isBlocked) changes.isBlocked = values.isBlocked;
    return changes;
}

export default function AdminUserModal({ user, onClose, onSaved }: AdminUserModalProps) {
    const [values, setValues] = useState<AdminUserInput>(() => initialValues(user));
    const [interestText, setInterestText] = useState((user?.interests || []).join(', '));
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const { message } = App.useApp();
    const editing = Boolean(user);

    const update = <K extends keyof AdminUserInput>(field: K, value: AdminUserInput[K]) => {
        setValues((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = async () => {
        const name = values.name.trim();
        const email = values.email.trim();
        const password = values.password?.trim() || '';
        if (!name || !email || (!editing && !password)) {
            setError('Name, email, and password are required when creating a user.');
            return;
        }

        const submitted: AdminUserInput = {
            ...values,
            name,
            email,
            password: password || undefined,
            profilePic: values.profilePic?.trim() || null,
            interests: interestText.split(',').map((value) => value.trim()).filter(Boolean),
        };
        setSaving(true);
        setError('');
        try {
            if (user) {
                const changes = changedValues(submitted, user);
                if (Object.keys(changes).length > 0) {
                    await updateAdminUser(user._id, changes);
                }
                message.success('User updated');
            } else {
                await createAdminUser({ ...submitted, password });
                message.success('User created');
            }
            onSaved();
            onClose();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to save user.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
            <div className="surface max-h-[92vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-7">
                <h2 className="text-2xl font-semibold text-slate-900">{editing ? 'Edit user' : 'Create user'}</h2>
                <p className="mt-1 text-sm text-slate-500">{editing ? 'Only changed fields will be submitted.' : 'Add a community account.'}</p>
                {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-600">{error}</p>}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">
                        Name
                        <input value={values.name} onChange={(event) => update('name', event.target.value)} className="soft-input mt-2 w-full px-4 outline-none" required />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                        Email
                        <input type="email" value={values.email} onChange={(event) => update('email', event.target.value)} className="soft-input mt-2 w-full px-4 outline-none" required />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                        Password {editing && <span className="font-normal text-slate-400">(optional)</span>}
                        <input type="password" value={values.password || ''} onChange={(event) => update('password', event.target.value)} className="soft-input mt-2 w-full px-4 outline-none" required={!editing} />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                        Role
                        <select value={values.role} onChange={(event) => update('role', event.target.value as AdminUserInput['role'])} className="soft-input mt-2 w-full px-4 outline-none">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                        Profile picture URL
                        <input value={values.profilePic || ''} onChange={(event) => update('profilePic', event.target.value)} className="soft-input mt-2 w-full px-4 outline-none" />
                    </label>
                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                        Bio
                        <textarea value={values.bio} onChange={(event) => update('bio', event.target.value)} className="soft-input mt-2 min-h-24 w-full p-4 outline-none" />
                    </label>
                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                        Interests
                        <input value={interestText} onChange={(event) => setInterestText(event.target.value)} placeholder="Design, Travel, Technology" className="soft-input mt-2 w-full px-4 outline-none" />
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input type="checkbox" checked={values.isBlocked} onChange={(event) => update('isBlocked', event.target.checked)} />
                        Block this account
                    </label>
                </div>
                <div className="mt-7 flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="secondary-button">Cancel</button>
                    <button type="button" onClick={() => void handleSubmit()} disabled={saving} className="primary-button">
                        {saving ? 'Saving...' : editing ? 'Save changes' : 'Create user'}
                    </button>
                </div>
            </div>
        </div>
    );
}
