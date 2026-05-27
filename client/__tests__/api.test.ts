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
    getMutedUsers,
    getPostLikes,
    getRecommendedPosts,
    getSuggestedUsers,
    getTrendingPosts,
    getAdminActivities,
    getAdminDashboard,
    getAdminPost,
    getAdminPosts,
    getAdminUser,
    getAdminUsers,
    getUserProfile,
    hidePost,
    muteUser,
    removeBookmark,
    unhidePost,
    unarchivePost,
    unmuteUser,
    unblockUser,
    rejectFollowRequest,
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

        expect(fetchMock.mock.calls[0][0]).toContain('/posts?page=1&limit=20');
        expect(fetchMock.mock.calls[1][0]).toContain('/posts/following?page=1&limit=20');
        expect(fetchMock.mock.calls[2][0]).toContain('/posts/trending?period=month&limit=8');
        expect(fetchMock.mock.calls[3][0]).toContain('/posts/recommended?limit=12');
        expect(fetchMock.mock.calls[4][0]).toContain('/users/suggested?limit=10');
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
    });

    it('requests paginated likes and relationship lists', async () => {
        await getPostLikes('post-7', 2, 10);
        await getFollowers('user-1');
        await getFollowing('user-1', 3, 5);

        expect(fetchMock.mock.calls[0][0]).toContain('/posts/post-7/likes?page=2&limit=10');
        expect(fetchMock.mock.calls[1][0]).toContain('/users/user-1/followers?page=1&limit=20');
        expect(fetchMock.mock.calls[2][0]).toContain('/users/user-1/following?page=3&limit=5');
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

    it('requests private profile, follow request, and archived post controls', async () => {
        await getUserProfile('user-2');
        await getFollowRequests(2, 20);
        await acceptFollowRequest('user-2');
        await rejectFollowRequest('user-3');
        await archivePost('post-2');
        await unarchivePost('post-2');
        await getArchivedPosts(3, 20);

        expect(fetchMock.mock.calls[0][0]).toContain('/users/profile/user-2');
        expect(fetchMock.mock.calls[1][0]).toContain('/users/follow-requests?page=2&limit=20');
        expect(fetchMock.mock.calls[2][0]).toContain('/users/follow-requests/user-2/accept');
        expect(fetchMock.mock.calls[3][0]).toContain('/users/follow-requests/user-3/reject');
        expect(fetchMock.mock.calls[4][0]).toContain('/posts/post-2/archive');
        expect(fetchMock.mock.calls[4][1].method).toBe('PATCH');
        expect(fetchMock.mock.calls[5][0]).toContain('/posts/post-2/unarchive');
        expect(fetchMock.mock.calls[6][0]).toContain('/posts/archived?page=3&limit=20');
    });

    it('requests only the current user activity with supported filters', async () => {
        await getMyActivities({ page: 2, limit: 20, type: 'user_followed' });

        expect(fetchMock.mock.calls[0][0]).toContain('/users/activities?page=2&limit=20&type=user_followed');
        expect(fetchMock.mock.calls[0][0]).not.toContain('actorId');
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
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
