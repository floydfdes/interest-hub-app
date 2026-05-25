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

export interface AdminUsersResponse {
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
}

export interface AdminUserDetailResponse {
    user: AdminUser;
    posts: IPost[];
}

export interface AdminPostsResponse {
    posts: IPost[];
    total: number;
    page: number;
    limit: number;
}

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
