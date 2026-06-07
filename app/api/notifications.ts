import { NotificationPreferences, NotificationsResponse, UnreadNotificationsResponse } from "@/app/types/user";
import { request } from "./client";
import { ClearNotificationsResponse, MessageResponse, RawUnreadNotificationsResponse } from "./contracts";

export const getNotifications = (page = 1, limit = 20) =>
    request<NotificationsResponse>("GET", "/notifications", { queryParams: { page, limit } });
export const getUnreadNotificationCount = async (): Promise<UnreadNotificationsResponse> => {
    const response = await request<RawUnreadNotificationsResponse>("GET", "/notifications/unread-count");
    return { count: response.count ?? response.unreadCount ?? 0 };
};
export const markNotificationRead = (id: string) =>
    request<MessageResponse>("PATCH", `/notifications/${id}/read`);
export const markAllNotificationsRead = () =>
    request<MessageResponse>("PATCH", "/notifications/read-all");
export const deleteNotification = (id: string) =>
    request<MessageResponse>("DELETE", `/notifications/${id}`);
export const clearReadNotifications = () =>
    request<ClearNotificationsResponse>("DELETE", "/notifications/read");
export const clearAllNotifications = () =>
    request<ClearNotificationsResponse>("DELETE", "/notifications");

export const getNotificationPreferences = () =>
    request<NotificationPreferences>("GET", "/notifications/preferences");
export const updateNotificationPreferences = (preferences: Partial<NotificationPreferences>) =>
    request<NotificationPreferences>("PATCH", "/notifications/preferences", { body: { ...preferences } });
