// types/user.ts
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

export interface IReply {
    _id?: string;
    user: IUserPreview;
    content: string;
    likes: string[];
    createdAt: string;
}

export interface IComment {
    _id: string;
    user: IUserPreview;
    post: string;
    content: string;
    likes: string[];
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
    likes: string[];
    comments: IComment[];
    visibility: "public" | "private" | "followersOnly";
    viewCount: number;
    sharedFrom: string | null;
    isEdited: boolean;
    createdAt: string;
    updatedAt: string;
}
