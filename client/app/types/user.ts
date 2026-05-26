export interface IUser {
    _id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    profilePic: string;
    bio: string;
    interests: string[];
    followers: string[];
    following: string[];
    blockedUsers: string[];
    mutedUsers: string[];
    hiddenPosts: string[];
    otp: string | null;
    otpExpires: string | null;
    is2FAEnabled: boolean;
    twoFASecret: string;
    resetToken: string | null;
    resetTokenExpiry: string | null;
    isBlocked: boolean;
    warnings: {
        reason: string;
        date: string;
    }[];
    createdAt: string;
    updatedAt: string;
}

export interface IUserPreview {
    _id: string;
    name: string;
    profilePic: string;
}

export type Like = string | IUserPreview;

export interface IReply {
    _id: string;
    user: IUserPreview;
    content: string;
    likes: Like[];
    createdAt: string;
    replies?: IReply[];
}

export interface IComment {
    _id: string;
    user: IUserPreview;
    post: string;
    content: string;
    likes: Like[];
    replies: IReply[];
    createdAt: string;
    updatedAt: string;
    isEditing?: boolean;
    editContent?: string;
    newReply?: string;
}

export interface IPost {
    _id: string;
    title: string;
    content: string;
    image: string;
    category: string;
    tags: string[];
    author: IUserPreview;
    likes: Like[];
    comments: IComment[];
    visibility: "public" | "private" | "followersOnly";
    viewCount: number;
    sharedFrom: string | null;
    isEdited: boolean;
    isBookmarked?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    token: string;
    user: IUser;
}

export interface UserResponse {
    user: IUser;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: Pagination;
}

export type ActivityType =
    | "login"
    | "post_created"
    | "user_followed"
    | "post_liked"
    | "report_submitted"
    | "user_blocked"
    | "user_unblocked";

export interface BasicUserSummary {
    _id: string;
    name: string;
    profilePic: string | null;
}

export interface AdminActivityUserSummary extends BasicUserSummary {
    email: string;
    role: IUser["role"];
}

export interface BasicPostSummary {
    _id: string;
    title: string;
    image: string;
}

export interface UserActivity {
    _id: string;
    actor: BasicUserSummary;
    type: ActivityType;
    targetUser?: BasicUserSummary;
    post?: BasicPostSummary;
    createdAt: string;
    updatedAt: string;
}

export interface AdminUserActivity extends Omit<UserActivity, "actor" | "targetUser"> {
    actor: AdminActivityUserSummary;
    targetUser?: AdminActivityUserSummary;
    ipAddress?: string;
    userAgent?: string;
    metadata: Record<string, unknown>;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput extends LoginInput {
    name: string;
}

export interface PostInput {
    title: string;
    content: string;
    category: string;
    visibility: IPost["visibility"];
    image: string;
    tags?: string[];
}

export type PostUpdateInput = Omit<PostInput, "image"> & {
    image?: string;
};

export type ProfileUpdateInput = Partial<
    Pick<IUser, "name" | "bio" | "interests" | "profilePic">
>;

export type AdminUser = Omit<IUser, "profilePic"> & {
    profilePic: string | null;
};

export interface AdminDashboardCounts {
    totalUsers: number;
    adminUsers: number;
    blockedUsers: number;
    totalPosts: number;
    totalComments: number;
    totalReplies: number;
}

export interface AdminDashboardResponse {
    counts: AdminDashboardCounts;
    recentUsers: AdminUser[];
    recentPosts: IPost[];
}

export type AdminUsersResponse = PaginatedResponse<AdminUser>;

export interface AdminUserDetailResponse {
    user: AdminUser;
    posts: IPost[];
}

export type AdminPostsResponse = PaginatedResponse<IPost>;

export type AdminActivitiesResponse = PaginatedResponse<AdminUserActivity>;

export type MyActivitiesResponse = PaginatedResponse<UserActivity>;

export type BlockedUsersResponse = PaginatedResponse<BasicUserSummary>;

export type MutedUsersResponse = PaginatedResponse<BasicUserSummary>;

export type HiddenPostsResponse = PaginatedResponse<IPost>;

export interface AdminUserInput {
    name: string;
    email: string;
    password?: string;
    role: IUser["role"];
    profilePic: string | null;
    bio: string;
    interests: string[];
    isBlocked: boolean;
}

export type AdminUserUpdateInput = Partial<AdminUserInput>;
