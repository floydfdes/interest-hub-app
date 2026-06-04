import { ShareInput, SharesResponse, UserShare } from "@/app/types/user";
import { request } from "./client";

export const createShare = (data: ShareInput) =>
    request<UserShare>("POST", "/shares", { body: { ...data } });
export const getReceivedShares = (page = 1, limit = 20) =>
    request<SharesResponse>("GET", "/shares/received", { queryParams: { page, limit } });
export const getSentShares = (page = 1, limit = 20) =>
    request<SharesResponse>("GET", "/shares/sent", { queryParams: { page, limit } });
