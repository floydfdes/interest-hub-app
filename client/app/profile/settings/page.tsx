/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
    changePassword,
    deleteUser,
    forgotPassword,
    resetPassword
} from "@/app/api/api";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
                router.push("/login");
            }

            closeModal();
        } catch (err: any) {
            setError(err.message || "Something went wrong");
            setLoading(false);
        }
    };

    const renderModal = () => {
        if (!modal) return null;

        return (
            <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">

                <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
                    <h2 className="text-xl font-semibold text-primary mb-4 capitalize">
                        {modal === "delete" ? "Delete Account" : modal + " Password"}
                    </h2>

                    {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                    {modal === "change" && (
                        <>
                            <input
                                type="password"
                                placeholder="Current Password"
                                className="mb-3 p-2 border w-full rounded"
                                value={form.currentPassword}
                                onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                className="mb-3 p-2 border w-full rounded"
                                value={form.newPassword}
                                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                            />
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                className="mb-3 p-2 border w-full rounded"
                                value={form.confirmPassword}
                                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                            />
                        </>
                    )}

                    {modal === "forgot" && (
                        <input
                            type="email"
                            placeholder="Email"
                            className="mb-3 p-2 border w-full rounded"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        />
                    )}

                    {modal === "reset" && (
                        <>
                            <input
                                type="text"
                                placeholder="Reset Token"
                                className="mb-3 p-2 border w-full rounded"
                                value={form.resetToken}
                                onChange={(e) => setForm((f) => ({ ...f, resetToken: e.target.value }))}
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                className="mb-3 p-2 border w-full rounded"
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
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className={`px-4 py-2 rounded text-white ${modal === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-opacity-90"
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
        <div className="min-h-screen bg-background p-8 flex justify-center items-start">
            <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow">
                <h1 className="text-2xl font-semibold text-primary mb-6">Settings</h1>

                <div className="flex flex-col space-y-3">
                    <button
                        onClick={() => setModal("change")}
                        className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-left"
                    >
                        Change Password
                    </button>
                    <button
                        onClick={() => setModal("forgot")}
                        className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-left"
                    >
                        Forgot Password
                    </button>
                    <button
                        onClick={() => setModal("reset")}
                        className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-left"
                    >
                        Reset Password (with token)
                    </button>

                    <hr className="my-4" />

                    <button
                        onClick={() => setModal("delete")}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-left"
                    >
                        Delete Account
                    </button>
                </div>
            </div>

            {renderModal()}
        </div>
    );
}
