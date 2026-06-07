import { AuthResponse, IUser, LoginInput, RegisterInput } from "@/app/types/user";
import { request } from "./client";

type RawAuthResponse = Omit<AuthResponse, "user"> & {
    user: IUser & { id?: string };
};

function normalizeAuthResponse(response: RawAuthResponse): AuthResponse {
    return {
        ...response,
        user: {
            ...response.user,
            _id: response.user._id || response.user.id || "",
        },
    };
}

export const registerUser = async (data: RegisterInput) =>
    normalizeAuthResponse(await request<RawAuthResponse>("POST", "/auth/register", { body: { ...data } }));
export const loginUser = async (data: LoginInput) =>
    normalizeAuthResponse(await request<RawAuthResponse>("POST", "/auth/login", { body: { ...data } }));
export const refreshToken = () => request<AuthResponse>("POST", "/auth/refresh");
export const logoutUser = () => request<void>("POST", "/auth/logout");
export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
    request<void>("PATCH", "/auth/change-password", { body: { ...data } });
export const forgotPassword = (email: string) =>
    request<void>("POST", "/auth/forgot-password", { body: { email } });
export const resetPassword = (data: { token: string; newPassword: string }) =>
    request<void>("POST", "/auth/reset-password", { body: { ...data } });

export const reactivateUser = async (data: LoginInput) =>
    normalizeAuthResponse(await request<RawAuthResponse>("POST", "/auth/reactivate", { body: { ...data } }));
