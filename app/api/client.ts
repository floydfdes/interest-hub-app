const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4300/api";

export type QueryValue = string | number | boolean;
type RequestBody = Record<string, unknown>;

interface RequestOptions {
    body?: RequestBody;
    queryParams?: Record<string, QueryValue>;
}

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

function startLoader() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("loader:start"));
    }
}

function stopLoader() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("loader:stop"));
    }
}

export function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
}

function getApiErrorMessage(data: unknown) {
    if (!data || typeof data !== "object") return "Request failed";

    const payload = data as { message?: unknown; errors?: unknown };
    if (Array.isArray(payload.errors)) {
        const errors = payload.errors
            .filter((error): error is string => typeof error === "string" && error.trim().length > 0)
            .map((error) => error.trim());
        if (errors.length > 0) return errors.join("\n");
    }

    if (typeof payload.message === "string" && payload.message.trim()) {
        return payload.message.trim();
    }

    return "Request failed";
}

export const request = async <T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> => {
    startLoader();
    try {
        const url = new URL(`${API_BASE}${endpoint}`);
        Object.entries(options.queryParams || {}).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "x-requested-with": "InterestHubFrontend",
        };
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(url.toString(), {
            method,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new ApiError(getApiErrorMessage(data), response.status);
        }

        if (response.status === 204) return undefined as T;
        return await response.json() as T;
    } finally {
        stopLoader();
    }
};
