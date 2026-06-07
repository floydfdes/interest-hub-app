"use client";

import {
    changePassword,
    deactivateUser,
    deleteUser,
    forgotPassword,
    getErrorMessage,
    getMe,
    getNotificationPreferences,
    resetPassword,
    updateNotificationPreferences,
    updateUser
} from "@/app/api/api";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { notifyAuthChanged } from "@/app/hooks/useCurrentUser";
import Link from "next/link";
import { NotificationPreferences } from "@/app/types/user";

const notificationPreferenceLabels: Record<keyof NotificationPreferences, string> = {
    likes: "Likes",
    comments: "Comments",
    replies: "Replies",
    follows: "Follows",
    followRequests: "Follow requests",
    mentions: "Mentions",
    shares: "Shares",
    moderation: "Moderation",
};

export default function SettingsPage() {
    const [modal, setModal] = useState<null | "change" | "forgot" | "reset" | "delete" | "deactivate">(null);
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        resetToken: "",
        email: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [privacyLoading, setPrivacyLoading] = useState(true);
    const [privacySaving, setPrivacySaving] = useState(false);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [preferencesSaving, setPreferencesSaving] = useState<keyof NotificationPreferences | null>(null);
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;
        const loadPrivacy = async () => {
            if (!localStorage.getItem("token")) {
                if (!cancelled) setPrivacyLoading(false);
                return;
            }
            try {
                const [response, notificationPreferences] = await Promise.all([
                    getMe(),
                    getNotificationPreferences().catch(() => null),
                ]);
                if (!cancelled) {
                    setIsPrivate(Boolean(response.user.isPrivate));
                    if (notificationPreferences) setPreferences(notificationPreferences);
                }
            } catch {
                // Settings actions surface their own request failures.
            } finally {
                if (!cancelled) setPrivacyLoading(false);
            }
        };
        void loadPrivacy();
        return () => {
            cancelled = true;
        };
    }, []);

    const handlePrivacyChange = async (nextPrivate: boolean) => {
        setPrivacySaving(true);
        setError("");
        try {
            const response = await updateUser({ isPrivate: nextPrivate });
            setIsPrivate(Boolean(response.user.isPrivate));
            localStorage.setItem("user", JSON.stringify(response.user));
            notifyAuthChanged();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Failed to update account privacy"));
        } finally {
            setPrivacySaving(false);
        }
    };

    const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
        if (!preferences) return;

        const previous = preferences;
        setPreferences({ ...preferences, [key]: value });
        setPreferencesSaving(key);
        setError("");
        try {
            setPreferences(await updateNotificationPreferences({ [key]: value }));
        } catch (err: unknown) {
            setPreferences(previous);
            setError(getErrorMessage(err, "Failed to update notification preference"));
        } finally {
            setPreferencesSaving(null);
        }
    };

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

            if (modal === "deactivate") {
                await deactivateUser();
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
                        {modal === "delete" ? "Delete Account" : modal === "deactivate" ? "Deactivate Account" : modal + " Password"}
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

                    {modal === "deactivate" && (
                        <p className="mb-4 text-slate-600">
                            Deactivating signs you out and hides access until you reactivate with your email and password.
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
                            {loading ? "Processing..." : modal === "delete" ? "Delete" : modal === "deactivate" ? "Deactivate" : "Submit"}
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
                <div className="mb-5 flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-5 py-4">
                    <div>
                        <p className="font-medium text-slate-700">Private account</p>
                        <p className="mt-1 text-sm text-slate-500">Approve new followers before they can view your profile details.</p>
                    </div>
                    <input
                        type="checkbox"
                        aria-label="Private account"
                        checked={isPrivate}
                        onChange={(event) => void handlePrivacyChange(event.target.checked)}
                        disabled={privacyLoading || privacySaving}
                        className="h-5 w-5 accent-indigo-600"
                    />
                </div>
                {!modal && error && <p className="mb-5 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-600">{error}</p>}

                {preferences && (
                    <div className="mb-5 rounded-xl bg-slate-50 px-5 py-4">
                        <div className="mb-4">
                            <p className="font-medium text-slate-700">Notification preferences</p>
                            <p className="mt-1 text-sm text-slate-500">Choose which notifications the backend should create for your account.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {(Object.keys(notificationPreferenceLabels) as Array<keyof NotificationPreferences>).map((key) => (
                                <label key={key} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-700">
                                    {notificationPreferenceLabels[key]}
                                    <input
                                        type="checkbox"
                                        checked={preferences[key]}
                                        onChange={(event) => void handlePreferenceChange(key, event.target.checked)}
                                        disabled={preferencesSaving === key}
                                        className="h-5 w-5 accent-indigo-600"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col space-y-3">
                    <Link
                        href="/profile/follow-requests"
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        Follow Requests
                    </Link>
                    <Link
                        href="/profile/activities"
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        Activity History
                    </Link>
                    <Link
                        href="/profile/reports"
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        My Reports
                    </Link>
                    <Link
                        href="/profile/shares"
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        Shares
                    </Link>
                    <Link
                        href="/profile/blocked"
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        Blocked Users
                    </Link>
                    <Link
                        href="/profile/muted"
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        Muted Users
                    </Link>
                    <Link
                        href="/profile/hidden-posts"
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        Hidden Posts
                    </Link>
                    <Link
                        href="/profile/recently-viewed"
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        Recently Viewed
                    </Link>
                    <Link
                        href="/profile/drafts"
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        Draft Posts
                    </Link>
                    <Link
                        href="/profile/review-posts"
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        Under Review
                    </Link>
                    <Link
                        href="/profile/archived-posts"
                        className="rounded-xl bg-slate-50 px-5 py-4 text-left font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        Archived Posts
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
                        onClick={() => setModal("deactivate")}
                        className="rounded-xl bg-amber-50 px-5 py-4 text-left font-medium text-amber-700 transition hover:bg-amber-100"
                    >
                        Deactivate Account
                    </button>
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
