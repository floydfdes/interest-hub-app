export interface IUser {
    _id: string;
    name: string;
    username?: string;
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
    isPrivate: boolean;
    followRequests: string[];
    isFollowing?: boolean;
    hasRequestedFollow?: boolean;
    canViewProfile?: boolean;
    followersCount?: number;
    followingCount?: number;
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
    username?: string;
    profilePic: string;
}

export type Like = string | IUserPreview;

export interface IReply {
    _id: string;
    user: IUserPreview;
    content: string;
    likes: Like[];
    needsReview?: boolean;
    moderationReasons?: string[];
    moderationNotice?: ModerationNotice;
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
    needsReview?: boolean;
    moderationReasons?: string[];
    moderationNotice?: ModerationNotice;
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
    likes?: Like[];
    comments?: IComment[];
    likesCount: number;
    commentsCount: number;
    isLikedByMe: boolean;
    isSavedByMe: boolean;
    visibility: "public" | "private" | "followersOnly";
    status?: "draft" | "published";
    viewCount: number;
    sharedFrom: string | null;
    isEdited: boolean;
    isBookmarked?: boolean;
    isArchived?: boolean;
    archivedAt?: string | null;
    needsReview?: boolean;
    moderationReasons?: string[];
    moderationNotice?: ModerationNotice;
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

export interface TagSummary {
    tag: string;
    postsCount: number;
}

export interface TrendingTag extends TagSummary {
    lastUsedAt: string;
}

export type TagPostsResponse = PaginatedResponse<IPost>;

export interface ModerationNotice {
    needsReview: true;
    reasons: string[];
    message: string;
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

export type ReportTargetType = "post" | "comment" | "user";

export type ReportReason =
    | "spam"
    | "harassment"
    | "hate_speech"
    | "violence"
    | "sexual_content"
    | "misinformation"
    | "impersonation"
    | "other";

export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export type ReportAction = "none" | "content_hidden" | "content_removed" | "user_suspended";

export interface ReportInput {
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    details?: string;
}

export interface ReportCommentSummary {
    _id: string;
    content: string;
    user?: BasicUserSummary;
}

export interface UserReport {
    _id: string;
    targetType: ReportTargetType;
    reason: ReportReason;
    details?: string;
    status: ReportStatus;
    action: ReportAction;
    reporter?: BasicUserSummary | AdminActivityUserSummary;
    post?: BasicPostSummary;
    comment?: ReportCommentSummary;
    user?: BasicUserSummary;
    targetUser?: BasicUserSummary;
    note?: string;
    createdAt?: string;
    updatedAt?: string;
}


export type NotificationType =
    | "post_liked"
    | "user_followed"
    | "user_mentioned"
    | "post_shared"
    | "profile_shared"
    | "comment_created"
    | "reply_created"
    | "moderation_review"
    | "report_resolved"
    | "system";

export interface UserNotification {
    _id: string;
    recipient?: string;
    actor?: BasicUserSummary;
    type: NotificationType;
    title?: string;
    message: string;
    post?: BasicPostSummary;
    comment?: ReportCommentSummary;
    targetUser?: BasicUserSummary;
    link?: string;
    isRead: boolean;
    readAt?: string | null;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface UnreadNotificationsResponse {
    count: number;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput extends LoginInput {
    name: string;
    username?: string;
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

export type DraftPostInput = Partial<PostInput>;

export type DraftPostsResponse = PaginatedResponse<IPost>;

export type ProfileUpdateInput = Partial<
    Pick<IUser, "name" | "bio" | "interests" | "profilePic" | "isPrivate">
>;

export interface PublicUserProfile {
    _id: string;
    name: string;
    profilePic: string | null;
    isPrivate: boolean;
    isFollowing: boolean;
    hasRequestedFollow: boolean;
    canViewProfile: boolean;
    bio?: string;
    interests?: string[];
    followersCount: number;
    followingCount: number;
    postsCount: number;
    posts?: IPost[];
}

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

export type MyReportsResponse = PaginatedResponse<UserReport>;

export type NotificationsResponse = PaginatedResponse<UserNotification>;

export type AdminReportsResponse = PaginatedResponse<UserReport>;

export type BlockedUsersResponse = PaginatedResponse<BasicUserSummary>;

export type MutedUsersResponse = PaginatedResponse<BasicUserSummary>;

export type HiddenPostsResponse = PaginatedResponse<IPost>;

export type FollowRequestsResponse = PaginatedResponse<BasicUserSummary>;

export type ArchivedPostsResponse = PaginatedResponse<IPost>;

export type UserPostsResponse = PaginatedResponse<IPost>;

export interface SavedCollection {
    _id: string;
    name: string;
    postsCount: number;
    createdAt: string;
    updatedAt: string;
}

export type SavedCollectionsResponse = SavedCollection[];

export type CollectionPostsResponse = PaginatedResponse<IPost>;

export type RecentlyViewedPostsResponse = PaginatedResponse<IPost>;

export type ShareTargetType = "post" | "profile";

export interface ShareInput {
    recipientId: string;
    targetType: ShareTargetType;
    targetId: string;
    message?: string;
}

export interface UserShare {
    _id: string;
    sender?: BasicUserSummary;
    recipient?: BasicUserSummary;
    targetType: ShareTargetType;
    targetId?: string;
    post?: BasicPostSummary;
    profile?: BasicUserSummary;
    targetUser?: BasicUserSummary;
    message?: string;
    createdAt: string;
    updatedAt?: string;
}

export type SharesResponse = PaginatedResponse<UserShare>;

export interface AdminUserInput {
    name: string;
    username?: string;
    email: string;
    password?: string;
    role: IUser["role"];
    profilePic: string | null;
    bio: string;
    interests: string[];
    isBlocked: boolean;
}

export type AdminUserUpdateInput = Partial<AdminUserInput>;

export type AdminBulkUserInput = AdminUserInput & {
    password: string;
};

export interface AdminBulkCreateUsersResponse {
    message: string;
    created: number;
    users: Array<Pick<AdminUser, "_id" | "name" | "email" | "role">>;
}

export interface AdminBulkPostInput {
    author: string;
    title: string;
    content: string;
    image: string;
    category: string;
    tags?: string[];
    visibility?: IPost["visibility"];
}

export interface AdminBulkCreatedPost extends Omit<AdminBulkPostInput, "visibility"> {
    _id: string;
    visibility: IPost["visibility"];
}

export interface AdminBulkCreatePostsResponse {
    message: string;
    created: number;
    posts: AdminBulkCreatedPost[];
}
