"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { getErrorMessage, resetPassword } from "../api/api";
import { Suspense, useState } from "react";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleReset = async () => {
        if (!token) return setError("Missing or invalid token.");
        if (!password || !confirmPassword) return setError("Please fill in all fields.");
        if (password !== confirmPassword) return setError("Passwords do not match.");
        if (password.length < 6) return setError("Password must be at least 6 characters.");

        try {
            await resetPassword({ token, newPassword: password });
            setSuccess("Password reset successfully. Redirecting to login...");
            setTimeout(() => router.push("/login"), 2000);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Failed to reset password."));
        }
    };

    return (
        <div className="shell-container flex min-h-[calc(100vh-14rem)] items-center justify-center">
            <div className="surface w-full max-w-md p-8">
                <span className="eyebrow">Security</span>
                <h1 className="mb-7 mt-4 text-3xl font-bold tracking-tight text-slate-900">Reset password</h1>

                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                {success && <p className="text-green-600 mb-4 text-center">{success}</p>}

                <input
                    type="password"
                    placeholder="New Password"
                    className="soft-input mb-4 w-full px-4 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Confirm New Password"
                    className="soft-input mb-6 w-full px-4 outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button
                    onClick={handleReset}
                    className="primary-button w-full"
                >
                    Reset Password
                </button>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <ResetPasswordForm />
        </Suspense>
    );
}
