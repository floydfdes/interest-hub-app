/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { resetPassword } from "../api/api";
import { useState } from "react";

export default function ResetPasswordPage() {
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
        } catch (err: any) {
            setError(err.message || "Failed to reset password.");
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-primary mb-6 text-center">Reset Your Password</h1>

                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                {success && <p className="text-green-600 mb-4 text-center">{success}</p>}

                <input
                    type="password"
                    placeholder="New Password"
                    className="w-full mb-4 p-3 border rounded-md"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Confirm New Password"
                    className="w-full mb-6 p-3 border rounded-md"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button
                    onClick={handleReset}
                    className="w-full bg-primary text-white py-3 rounded-md hover:bg-opacity-90"
                >
                    Reset Password
                </button>
            </div>
        </div>
    );
}
