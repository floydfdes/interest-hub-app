"use client";

import {
    changePassword,
    deleteUser,
    forgotPassword,
    getErrorMessage,
    resetPassword
} from "@/app/api/api";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { notifyAuthChanged } from "@/app/hooks/useCurrentUser";
import Link from "next/link";

export default function SettingsPage() {
    const [modal, setModal] = useState<null | "change" | "forgot" | "reset" | "delete">(null);
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        resetToken: "",
        email: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const closeModal = () => {
        setModal(null);
        setForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
            resetToken: "",
            email: ""
        });
        setError("");
        setLoading(false);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        try {
            if (modal === "change") {
                if (form.newPassword !== form.confirmPassword) {
                    setError("Passwords do not match");
                    setLoading(false);
                    return;
                }

                await changePassword({
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword
                });
            }

            if (modal === "forgot") {
                await forgotPassword(form.email);
            }

            if (modal === "reset") {
                await resetPassword({
                    token: form.resetToken,
                    newPassword: form.newPassword
                });
            }

            if (modal === "delete") {
                await deleteUser();
                localStorage.clear();
                notifyAuthChanged();
                router.push("/login");
            }

            closeModal();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Something went wrong"));
            setLoading(false);
        }
    };

    const renderModal = () => {
        if (!modal) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm">

                <div className="surface relative w-full max-w-md p-6">
                    <h2 className="mb-5 text-xl font-semibold capitalize text-slate-900">
                        {modal === "delete" ? "Delete Account" : modal + " Password"}
                    </h2>

                    {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                    {modal === "change" && (
                        <>
                            <input
                                type="password"
                                placeholder="Current Password"
                                className="soft-input mb-3 w-full px-4 outline-none"
                                value={form.currentPassword}
                                onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                className="soft-input mb-3 w-full px-4 outline-none"
                                value={form.newPassword}
                                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                            />
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                className="soft-input mb-3 w-full px-4 outline-none"
                                value={form.confirmPassword}
                                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                            />
                        </>
                    )}

                    {modal === "forgot" && (
                        <input
                            type="email"
                            placeholder="Email"
                            className="soft-input mb-3 w-full px-4 outline-none"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        />
                    )}

                    {modal === "reset" && (
                        <>
                            <input
                                type="text"
                                placeholder="Reset Token"
                                className="soft-input mb-3 w-full px-4 outline-none"
                                value={form.resetToken}
                                onChange={(e) => setForm((f) => ({ ...f, resetToken: e.target.value }))}
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                className="soft-input mb-3 w-full px-4 outline-none"
                                value={form.newPassword}
                                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                            />
                        </>
                    )}

                    {modal === "delete" && (
                        <p className="text-red-500 mb-4">
                            Are you sure you want to delete your account? This action is irreversible.
                        </p>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={closeModal}
                            className="secondary-button"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className={`rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${modal === "delete" ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                            disabled={loading}
                        >
                            {loading ? "Processing..." : modal === "delete" ? "Delete" : "Submit"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="shell-container flex justify-center">
            <div className="surface w-full max-w-xl p-7 sm:p-8">
                <span className="eyebrow">Account</span>
                <h1 className="mb-7 mt-4 text-3xl font-bold tracking-tight text-slate-900">Settings</h1>

                <div className="flex flex-col space-y-3">
                    <Link
                        href="/profile/activities"
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        Activity History
                    </Link>
                    <button
                        onClick={() => setModal("change")}
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        Change Password
                    </button>
                    <button
                        onClick={() => setModal("forgot")}
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        Forgot Password
                    </button>
                    <button
                        onClick={() => setModal("reset")}
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        Reset Password (with token)
                    </button>

                    <hr className="my-4" />

                    <button
                        onClick={() => setModal("delete")}
                        className="rounded-xl bg-rose-50 px-5 py-4 text-left font-medium text-rose-600 transition hover:bg-rose-100"
                    >
                        Delete Account
                    </button>
                </div>
            </div>

            {renderModal()}
        </div>
    );
}
