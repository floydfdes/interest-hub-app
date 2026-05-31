import {
    acceptFollowRequest,
    archivePost,
    bulkDeleteAdminComments,
    bulkDeleteAdminPosts,
    bulkDeleteAdminUsers,
    bulkCreateAdminPosts,
    bulkCreateAdminUsers,
    blockUser,
    checkAdminAccess,
    createAdminUser,
    createShare,
    createDraftPost,
    deleteAdminComment,
    deleteAdminPost,
    deleteAdminReply,
    deleteAdminUser,
    bookmarkPost,
    getHiddenPosts,
    getArchivedPosts,
    getAllPosts,
    getBookmarkedPosts,
    getBlockedUsers,
    getFollowers,
    getFollowing,
    getFollowRequests,
    getFollowingPosts,
    getMyActivities,
    getMyReports,
    getMutedUsers,
    clearAllNotifications,
    clearReadNotifications,
    deleteNotification,
    getNotifications,
    getPostComments,
    getPostLikes,
    getRecommendedPosts,
    getTagPosts,
    getTagSuggestions,
    getTrendingTags,
    getUnreadNotificationCount,
    getDraftPosts,
    getReceivedShares,
    getReviewPosts,
    getSentShares,
    getSuggestedUsers,
    getTrendingPosts,
    getAdminActivities,
    getAdminReport,
    getAdminReports,
    getAdminDashboard,
    getAdminPost,
    getAdminPosts,
    getAdminUser,
    getAdminUsers,
    getUserPosts,
    getUserProfile,
    hidePost,
    markAllNotificationsRead,
    markNotificationRead,
    muteUser,
    removeBookmark,
    unhidePost,
    unarchivePost,
    unmuteUser,
    unblockUser,
    rejectFollowRequest,
    submitReport,
    updateDraftPost,
    publishDraftPost,
    updateAdminReportStatus,
    applyAdminReportAction,
    updateAdminUser,
} from '@/app/api/api';

function mockResponse(data: unknown) {
    return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => data,
    } as Response);
}

describe('discovery and bookmark API client', () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
        fetchMock.mockReset();
        fetchMock.mockImplementation(() => mockResponse([]));
        global.fetch = fetchMock as typeof fetch;
        localStorage.setItem('token', 'test-token');
    });

    it('requests each discovery endpoint with typed query parameters and auth headers', async () => {
        await getAllPosts();
        await getFollowingPosts();
        await getTrendingPosts('month', 8);
        await getRecommendedPosts(12);
        await getSuggestedUsers();
        await getTagSuggestions('tra', 10);
        await getTrendingTags(20);
        await getTagPosts('travel', 2, 12);

        expect(fetchMock.mock.calls[0][0]).toContain('/posts?page=1&limit=20');
        expect(fetchMock.mock.calls[1][0]).toContain('/posts/following?page=1&limit=20');
        expect(fetchMock.mock.calls[2][0]).toContain('/posts/trending?period=month&limit=8');
        expect(fetchMock.mock.calls[3][0]).toContain('/posts/recommended?limit=12');
        expect(fetchMock.mock.calls[4][0]).toContain('/users/suggested?limit=10');
        expect(fetchMock.mock.calls[5][0]).toContain('/tags/suggestions?query=tra&limit=10');
        expect(fetchMock.mock.calls[6][0]).toContain('/tags/trending?limit=20');
        expect(fetchMock.mock.calls[7][0]).toContain('/tags/travel/posts?page=2&limit=12');
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
    });

    it('requests paginated likes and relationship lists', async () => {
        await getPostLikes('post-7', 2, 10);
        await getPostComments('post-7', 3, 5);
        await getFollowers('user-1');
        await getFollowing('user-1', 3, 5);

        expect(fetchMock.mock.calls[0][0]).toContain('/posts/post-7/likes?page=2&limit=10');
        expect(fetchMock.mock.calls[1][0]).toContain('/posts/post-7/comments?page=3&limit=5');
        expect(fetchMock.mock.calls[2][0]).toContain('/users/user-1/followers?page=1&limit=20');
        expect(fetchMock.mock.calls[3][0]).toContain('/users/user-1/following?page=3&limit=5');
    });

    it('requests personal block controls and the blocked users list', async () => {
        await blockUser('user-2');
        await unblockUser('user-2');
        await getBlockedUsers(2, 20);

        expect(fetchMock.mock.calls[0][0]).toContain('/users/block/user-2');
        expect(fetchMock.mock.calls[0][1].method).toBe('POST');
        expect(fetchMock.mock.calls[1][0]).toContain('/users/unblock/user-2');
        expect(fetchMock.mock.calls[1][1].method).toBe('POST');
        expect(fetchMock.mock.calls[2][0]).toContain('/users/blocked?page=2&limit=20');
    });

    it('requests mute and hide controls and normalizes muted user pagination', async () => {
        await muteUser('user-2');
        await unmuteUser('user-2');
        fetchMock.mockImplementationOnce(() => mockResponse({
            data: [{ _id: 'user-2', name: 'Jordan', profilePic: null }],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
        }));
        const muted = await getMutedUsers();
        await hidePost('post-2');
        await unhidePost('post-2');
        await getHiddenPosts(2, 20);

        expect(fetchMock.mock.calls[0][0]).toContain('/users/mute/user-2');
        expect(fetchMock.mock.calls[1][0]).toContain('/users/unmute/user-2');
        expect(fetchMock.mock.calls[2][0]).toContain('/users/muted?page=1&limit=20');
        expect(muted).toEqual({
            items: [{ _id: 'user-2', name: 'Jordan', profilePic: null }],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        });
        expect(fetchMock.mock.calls[3][0]).toContain('/posts/post-2/hide');
        expect(fetchMock.mock.calls[3][1].method).toBe('POST');
        expect(fetchMock.mock.calls[4][0]).toContain('/posts/post-2/hide');
        expect(fetchMock.mock.calls[4][1].method).toBe('DELETE');
        expect(fetchMock.mock.calls[5][0]).toContain('/posts/hidden?page=2&limit=20');
    });


    it('creates, updates, lists, and publishes drafts', async () => {
        await createDraftPost({ title: 'Draft', content: '', category: '', image: '', tags: ['travel'], visibility: 'public' });
        await getDraftPosts(2, 10);
        await updateDraftPost('draft-1', { title: 'Updated', content: 'Body', category: 'Travel', visibility: 'followersOnly' });
        await publishDraftPost('draft-1');

        expect(fetchMock.mock.calls[0][0]).toContain('/posts/drafts');
        expect(fetchMock.mock.calls[0][1]).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ title: 'Draft', content: '', category: '', image: '', tags: ['travel'], visibility: 'public' }),
        });
        expect(fetchMock.mock.calls[1][0]).toContain('/posts/drafts?page=2&limit=10');
        expect(fetchMock.mock.calls[2][0]).toContain('/posts/drafts/draft-1');
        expect(fetchMock.mock.calls[2][1]).toMatchObject({
            method: 'PUT',
            body: JSON.stringify({ title: 'Updated', content: 'Body', category: 'Travel', visibility: 'followersOnly' }),
        });
        expect(fetchMock.mock.calls[3][0]).toContain('/posts/drafts/draft-1/publish');
        expect(fetchMock.mock.calls[3][1].method).toBe('POST');
    });

    it('requests private profile, follow request, archived, and review post controls', async () => {
        await getUserProfile('user-2');
        await getUserPosts('user-2', 2, 10);
        await getFollowRequests(2, 20);
        await acceptFollowRequest('user-2');
        await rejectFollowRequest('user-3');
        await archivePost('post-2');
        await unarchivePost('post-2');
        await getArchivedPosts(3, 20);
        await getReviewPosts(2, 10);

        expect(fetchMock.mock.calls[0][0]).toContain('/users/profile/user-2');
        expect(fetchMock.mock.calls[1][0]).toContain('/users/user-2/posts?page=2&limit=10');
        expect(fetchMock.mock.calls[2][0]).toContain('/users/follow-requests?page=2&limit=20');
        expect(fetchMock.mock.calls[3][0]).toContain('/users/follow-requests/user-2/accept');
        expect(fetchMock.mock.calls[4][0]).toContain('/users/follow-requests/user-3/reject');
        expect(fetchMock.mock.calls[5][0]).toContain('/posts/post-2/archive');
        expect(fetchMock.mock.calls[5][1].method).toBe('PATCH');
        expect(fetchMock.mock.calls[6][0]).toContain('/posts/post-2/unarchive');
        expect(fetchMock.mock.calls[7][0]).toContain('/posts/archived?page=3&limit=20');
        expect(fetchMock.mock.calls[8][0]).toContain('/posts/review?page=2&limit=10');
    });

    it('requests only the current user activity with supported filters', async () => {
        await getMyActivities({ page: 2, limit: 20, type: 'user_followed' });

        expect(fetchMock.mock.calls[0][0]).toContain('/users/activities?page=2&limit=20&type=user_followed');
        expect(fetchMock.mock.calls[0][0]).not.toContain('actorId');
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
    });


    it('creates shares and requests share inboxes', async () => {
        await createShare({ recipientId: 'user-2', targetType: 'post', targetId: 'post-1', message: 'Check this out' });
        await createShare({ recipientId: 'user-3', targetType: 'profile', targetId: 'user-4' });
        await getReceivedShares(2, 10);
        await getSentShares(3, 5);

        expect(fetchMock.mock.calls[0][0]).toContain('/shares');
        expect(fetchMock.mock.calls[0][1]).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ recipientId: 'user-2', targetType: 'post', targetId: 'post-1', message: 'Check this out' }),
        });
        expect(fetchMock.mock.calls[1][1]).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ recipientId: 'user-3', targetType: 'profile', targetId: 'user-4' }),
        });
        expect(fetchMock.mock.calls[2][0]).toContain('/shares/received?page=2&limit=10');
        expect(fetchMock.mock.calls[3][0]).toContain('/shares/sent?page=3&limit=5');
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
    });

    it('requests notification inbox and read-state endpoints', async () => {
        await getNotifications(2, 10);
        await getUnreadNotificationCount();
        await markNotificationRead('notification-1');
        await markAllNotificationsRead();
        await deleteNotification('notification-1');
        await clearReadNotifications();
        await clearAllNotifications();

        expect(fetchMock.mock.calls[0][0]).toContain('/notifications?page=2&limit=10');
        expect(fetchMock.mock.calls[1][0]).toContain('/notifications/unread-count');
        expect(fetchMock.mock.calls[2][0]).toContain('/notifications/notification-1/read');
        expect(fetchMock.mock.calls[2][1].method).toBe('PATCH');
        expect(fetchMock.mock.calls[3][0]).toContain('/notifications/read-all');
        expect(fetchMock.mock.calls[3][1].method).toBe('PATCH');
        expect(fetchMock.mock.calls[4][0]).toContain('/notifications/notification-1');
        expect(fetchMock.mock.calls[4][1].method).toBe('DELETE');
        expect(fetchMock.mock.calls[5][0]).toContain('/notifications/read');
        expect(fetchMock.mock.calls[5][1].method).toBe('DELETE');
        expect(fetchMock.mock.calls[6][0]).toContain('/notifications');
        expect(fetchMock.mock.calls[6][1].method).toBe('DELETE');
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
    });

    it('submits reports and requests the current user report history', async () => {
        await submitReport({ targetType: 'post', targetId: 'post-7', reason: 'spam', details: 'Repeated ads' });
        await getMyReports(2, 20);

        expect(fetchMock.mock.calls[0][0]).toContain('/reports');
        expect(fetchMock.mock.calls[0][1]).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ targetType: 'post', targetId: 'post-7', reason: 'spam', details: 'Repeated ads' }),
        });
        expect(fetchMock.mock.calls[1][0]).toContain('/reports/me?page=2&limit=20');
    });

    it('uses bookmark list, create, and delete endpoints', async () => {
        fetchMock.mockImplementation(() => mockResponse({ message: 'ok' }));

        await getBookmarkedPosts();
        await bookmarkPost('post-7');
        await removeBookmark('post-7');

        expect(fetchMock.mock.calls[0][0]).toContain('/posts/bookmarks');
        expect(fetchMock.mock.calls[0][1].method).toBe('GET');
        expect(fetchMock.mock.calls[1][0]).toContain('/posts/post-7/bookmark');
        expect(fetchMock.mock.calls[1][1].method).toBe('POST');
        expect(fetchMock.mock.calls[2][1].method).toBe('DELETE');
    });

    it('surfaces validation error arrays from failed API responses', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ errors: ['Tags cannot be null'] }),
        } as Response);

        await expect(getAdminPost('post-1')).rejects.toThrow('Tags cannot be null');
    });

    it('constructs the protected admin management requests', async () => {
        await checkAdminAccess();
        await getAdminDashboard();
        await getAdminUsers('alex', 2, 20);
        await getAdminUser('user-1');
        await createAdminUser({
            name: 'Alex',
            email: 'alex@example.com',
            password: 'password',
            role: 'user',
            profilePic: null,
            bio: '',
            interests: [],
            isBlocked: false,
        });
        await updateAdminUser('user-1', { bio: 'Updated' });
        await deleteAdminUser('user-1');
        await bulkDeleteAdminUsers(['user-2', 'user-3']);
        await getAdminPosts('hello', 'author-1', 'public', 3, 20);
        await getAdminPost('post-1');
        await deleteAdminPost('post-1');
        await bulkDeleteAdminPosts(['post-2', 'post-3']);
        await deleteAdminComment('comment-1');
        await bulkDeleteAdminComments(['comment-2', 'comment-3']);
        await deleteAdminReply('comment-1', 2);

        expect(fetchMock.mock.calls[0][0]).toContain('/admin/access');
        expect(fetchMock.mock.calls[1][0]).toContain('/admin/dashboard');
        expect(fetchMock.mock.calls[2][0]).toContain('/admin/users?query=alex&page=2&limit=20');
        expect(fetchMock.mock.calls[4][1].method).toBe('POST');
        expect(fetchMock.mock.calls[5][1].method).toBe('PATCH');
        expect(fetchMock.mock.calls[6][1].method).toBe('DELETE');
        expect(fetchMock.mock.calls[7][0]).toContain('/admin/users/bulk-delete');
        expect(fetchMock.mock.calls[7][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ ids: ['user-2', 'user-3'] }) });
        expect(fetchMock.mock.calls[8][0]).toContain('/admin/posts?query=hello&authorId=author-1&visibility=public&page=3&limit=20');
        expect(fetchMock.mock.calls[11][0]).toContain('/admin/posts/bulk-delete');
        expect(fetchMock.mock.calls[11][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ ids: ['post-2', 'post-3'] }) });
        expect(fetchMock.mock.calls[12][0]).toContain('/admin/comments/comment-1');
        expect(fetchMock.mock.calls[13][0]).toContain('/admin/comments/bulk-delete');
        expect(fetchMock.mock.calls[13][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ ids: ['comment-2', 'comment-3'] }) });
        expect(fetchMock.mock.calls[14][0]).toContain('/admin/comments/comment-1/replies/2');
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
    });

    it('requests filtered paginated admin activities', async () => {
        await getAdminActivities({ page: 2, limit: 10, type: 'post_liked', actorId: 'user-7' });

        expect(fetchMock.mock.calls[0][0]).toContain('/admin/activities?page=2&limit=10&type=post_liked&actorId=user-7');
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
    });

    it('requests and moderates filtered admin reports', async () => {
        await getAdminReports({ page: 2, limit: 10, status: 'reviewing', targetType: 'comment' });
        await getAdminReport('report-1');
        await updateAdminReportStatus('report-1', 'dismissed', 'No violation');
        await applyAdminReportAction('report-2', 'content_hidden', 'Policy violation');

        expect(fetchMock.mock.calls[0][0]).toContain('/admin/reports?page=2&limit=10&status=reviewing&targetType=comment');
        expect(fetchMock.mock.calls[1][0]).toContain('/admin/reports/report-1');
        expect(fetchMock.mock.calls[2][1]).toMatchObject({
            method: 'PATCH',
            body: JSON.stringify({ status: 'dismissed', note: 'No violation' }),
        });
        expect(fetchMock.mock.calls[3][0]).toContain('/admin/reports/report-2/action');
        expect(fetchMock.mock.calls[3][1]).toMatchObject({
            method: 'PATCH',
            body: JSON.stringify({ action: 'content_hidden', note: 'Policy violation' }),
        });
    });

    it('posts admin bulk creation payloads', async () => {
        await bulkCreateAdminUsers([{
            name: 'Jane',
            email: 'jane@example.com',
            password: 'password123',
            role: 'user',
            profilePic: null,
            bio: '',
            interests: ['music'],
            isBlocked: false,
        }]);
        await bulkCreateAdminPosts([{
            author: 'user-1',
            title: 'TypeScript',
            content: 'Post',
            image: 'data:image/png;base64,a',
            category: 'Technology',
            tags: ['typescript'],
            visibility: 'public',
        }]);

        expect(fetchMock.mock.calls[0][0]).toContain('/admin/users/bulk-create');
        expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: expect.stringContaining('jane@example.com') });
        expect(fetchMock.mock.calls[1][0]).toContain('/admin/posts/bulk-create');
        expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST', body: expect.stringContaining('"author":"user-1"') });
    });

    it('preserves the forbidden status from the access request', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 403,
            json: async () => ({ message: 'Forbidden' }),
        } as Response);

        await expect(checkAdminAccess()).rejects.toMatchObject({ status: 403 });
    });
});
