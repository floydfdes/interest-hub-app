import { MyReportsResponse, ReportInput, UserReport } from "@/app/types/user";
import { request } from "./client";

export const submitReport = (data: ReportInput) =>
    request<UserReport>("POST", "/reports", { body: { ...data } });
export const getMyReports = (page = 1, limit = 20) =>
    request<MyReportsResponse>("GET", "/reports/me", { queryParams: { page, limit } });
