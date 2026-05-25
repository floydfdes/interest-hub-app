'use client';

import {
    blockAdminUser,
    bulkDeleteAdminUsers,
    deleteAdminUser,
    getAdminUsers,
    getErrorMessage,
    unblockAdminUser,
} from '@/app/api/api';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { AdminUser, AdminUsersResponse } from '@/app/types/user';
import AdminUserModal from '@/components/admin/AdminUserModal';
import { App, Empty, Skeleton } from 'antd';
import { Ban, Eye, Pencil, Plus, Search, Trash2, Undo2, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import Swal from 'sweetalert2';

export default function AdminUsersPage() {
    const [response, setResponse] = useState<AdminUsersResponse | null>(null);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalUser, setModalUser] = useState<AdminUser | null | undefined>();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const currentUser = useCurrentUser();
    const { message } = App.useApp();

    const loadUsers = async (page = 1, search = query) => {
        setLoading(true);
        setError('');
        setSelectedIds(new Set());
        try {
            setResponse(await getAdminUsers(search.trim(), page));
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load users.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        const loadInitialUsers = async () => {
            try {
                const users = await getAdminUsers();
                if (!cancelled) setResponse(users);
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load users.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void loadInitialUsers();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void loadUsers(1);
    };

    const handleBlock = async (user: AdminUser) => {
        try {
            await (user.isBlocked ? unblockAdminUser(user._id) : blockAdminUser(user._id));
            message.success(user.isBlocked ? 'User unblocked' : 'User blocked');
            await loadUsers(response?.pagination.page || 1);
        } catch (err: unknown) {
            message.error(getErrorMessage(err, 'Failed to update user status.'));
        }
    };

    const handleDelete = async (user: AdminUser) => {
        const result = await Swal.fire({
            title: 'Permanently delete user?',
            text: `Deleting ${user.name} also permanently deletes their associated content. This cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete permanently',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#e11d48',
        });
        if (!result.isConfirmed) return;

        try {
            await deleteAdminUser(user._id);
            message.success('User permanently deleted');
            await loadUsers(response?.pagination.page || 1);
        } catch (err: unknown) {
            message.error(getErrorMessage(err, 'Failed to delete user.'));
        }
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;

        const result = await Swal.fire({
            title: 'Permanently delete selected users?',
            text: 'This permanently deletes the selected users and their associated posts, comments, and replies. This cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete permanently',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#e11d48',
        });
        if (!result.isConfirmed) return;

        try {
            const deleted = await bulkDeleteAdminUsers(ids);
            message.success(`${deleted.deleted} ${deleted.deleted === 1 ? 'user' : 'users'} deleted permanently.`);
            if (deleted.requested > deleted.deleted) {
                message.info('Some selected users no longer existed.');
            }
            await loadUsers(response?.pagination.page || 1);
        } catch (err: unknown) {
            message.error(getErrorMessage(err, 'Failed to delete selected users.'));
        }
    };

    const selectableIds = response?.items
        .filter((user) => user._id !== currentUser?._id)
        .map((user) => user._id) || [];
    const allVisibleSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
    const toggleSelection = (id: string, checked: boolean) => {
        setSelectedIds((current) => {
            const next = new Set(current);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    };
    const toggleVisibleSelection = (checked: boolean) => {
        setSelectedIds((current) => {
            const next = new Set(current);
            selectableIds.forEach((id) => {
                if (checked) next.add(id);
                else next.delete(id);
            });
            return next;
        });
    };
    const totalPages = response?.pagination.totalPages || 1;

    return (
        <div>
            <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <span className="eyebrow"><UsersRound size={12} /> Administration</span>
                    <h1 className="gradient-heading mt-4 text-4xl font-bold">Users</h1>
                    <p className="mt-2 text-slate-500">Manage accounts and access status.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {selectedIds.size > 0 && (
                        <button type="button" onClick={() => void handleBulkDelete()} className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700">
                            <Trash2 size={16} className="mr-2 inline" /> Delete selected
                        </button>
                    )}
                    <button type="button" onClick={() => setModalUser(null)} className="primary-button">
                        <Plus size={16} /> Create user
                    </button>
                </div>
            </header>

            <form onSubmit={handleSearch} className="surface mb-6 flex flex-col gap-3 p-4 sm:flex-row">
                <input
                    aria-label="Search users"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by name or email..."
                    className="soft-input min-w-0 flex-1 px-4 text-sm outline-none"
                />
                <button type="submit" className="primary-button" disabled={loading}><Search size={16} /> Search</button>
            </form>

            {error && <p className="surface mb-5 p-4 text-sm font-medium text-rose-600">{error}</p>}

            {loading ? (
                <div className="surface p-6"><Skeleton active paragraph={{ rows: 7 }} /></div>
            ) : !response || response.items.length === 0 ? (
                <div className="surface px-6 py-14"><Empty description="No users found" /></div>
            ) : (
                <>
                    <div className="surface overflow-x-auto">
                        <table className="w-full min-w-[50rem] text-left text-sm">
                            <thead className="border-b border-slate-100 text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">
                                        <input
                                            type="checkbox"
                                            aria-label="Select all visible users"
                                            checked={allVisibleSelected}
                                            disabled={selectableIds.length === 0}
                                            onChange={(event) => toggleVisibleSelection(event.target.checked)}
                                        />
                                    </th>
                                    <th className="px-5 py-4 font-semibold">User</th>
                                    <th className="px-5 py-4 font-semibold">Role</th>
                                    <th className="px-5 py-4 font-semibold">Status</th>
                                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {response.items.map((user) => (
                                    <tr key={user._id} className="border-b border-slate-100 last:border-0">
                                        <td className="px-5 py-4">
                                            <input
                                                type="checkbox"
                                                aria-label={`Select ${user.name}`}
                                                checked={selectedIds.has(user._id)}
                                                disabled={user._id === currentUser?._id}
                                                onChange={(event) => toggleSelection(user._id, event.target.checked)}
                                            />
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-900">{user.name}</p>
                                            <p className="text-slate-500">{user.email}</p>
                                        </td>
                                        <td className="px-5 py-4 capitalize text-slate-600">{user.role}</td>
                                        <td className="px-5 py-4">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.isBlocked ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                                                {user.isBlocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/admin/users/${user._id}`} aria-label={`View ${user.name}`} className="rounded-xl bg-slate-50 p-2 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"><Eye size={16} /></Link>
                                                <button type="button" aria-label={`Edit ${user.name}`} onClick={() => setModalUser(user)} className="rounded-xl bg-slate-50 p-2 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"><Pencil size={16} /></button>
                                                <button type="button" aria-label={`${user.isBlocked ? 'Unblock' : 'Block'} ${user.name}`} onClick={() => void handleBlock(user)} className="rounded-xl bg-slate-50 p-2 text-slate-600 hover:bg-amber-50 hover:text-amber-700">
                                                    {user.isBlocked ? <Undo2 size={16} /> : <Ban size={16} />}
                                                </button>
                                                <button type="button" aria-label={`Delete ${user.name}`} onClick={() => void handleDelete(user)} className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-500">
                        <span>{response.pagination.total} users</span>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => void loadUsers(response.pagination.page - 1)} disabled={loading || !response.pagination.hasPreviousPage} className="secondary-button !min-h-0 !py-2 disabled:opacity-50">Previous</button>
                            <span>Page {response.pagination.page} of {totalPages}</span>
                            <button type="button" onClick={() => void loadUsers(response.pagination.page + 1)} disabled={loading || !response.pagination.hasNextPage} className="secondary-button !min-h-0 !py-2 disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </>
            )}

            {modalUser !== undefined && (
                <AdminUserModal
                    key={modalUser?._id || 'create'}
                    user={modalUser}
                    onClose={() => setModalUser(undefined)}
                    onSaved={() => void loadUsers(response?.pagination.page || 1)}
                />
            )}
        </div>
    );
}
