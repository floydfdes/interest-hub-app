import { ActivityType, IPost, MutedUsersResponse, ReportAction, ReportStatus, ReportTargetType } from "@/app/types/user";

export interface PostAdvancedSearchFilters {
    title?: string;
    content?: string;
    category?: string;
    tags?: string;
}

export type TrendingPeriod = "day" | "week" | "month" | "all";

export interface MessageResponse {
    message: string;
}

export interface FollowResponse extends MessageResponse {
    status: "followed" | "requested" | "existing";
}

export interface ArchivedPostResponse extends MessageResponse {
    post: Pick<IPost, "_id" | "isArchived" | "archivedAt">;
}

export interface BulkDeleteResponse extends MessageResponse {
    requested: number;
    deleted: number;
}

export interface ClearNotificationsResponse {
    deleted: number;
}

export interface AdminActivityFilters {
    page?: number;
    limit?: number;
    type?: ActivityType;
    actorId?: string;
}

export interface MyActivityFilters {
    page?: number;
    limit?: number;
    type?: ActivityType;
}

export interface AdminReportFilters {
    page?: number;
    limit?: number;
    status?: ReportStatus;
    targetType?: ReportTargetType;
}

export type RawMutedUsersResponse = {
    data: import("@/app/types/user").BasicUserSummary[];
    pagination: Omit<MutedUsersResponse["pagination"], "hasPreviousPage"> & {
        hasPrevPage: boolean;
    };
};

export type RawUnreadNotificationsResponse = {
    count?: number;
    unreadCount?: number;
};

export type ReportModerationAction = Exclude<ReportAction, "none">;
