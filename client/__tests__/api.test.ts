import {
    bulkDeleteAdminComments,
    bulkDeleteAdminPosts,
    bulkDeleteAdminUsers,
    checkAdminAccess,
    createAdminUser,
    deleteAdminComment,
    deleteAdminPost,
    deleteAdminReply,
    deleteAdminUser,
    bookmarkPost,
    getBookmarkedPosts,
    getFollowingPosts,
    getRecommendedPosts,
    getSuggestedUsers,
    getTrendingPosts,
    getAdminDashboard,
    getAdminPost,
    getAdminPosts,
    getAdminUser,
    getAdminUsers,
    removeBookmark,
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
        await getFollowingPosts();
        await getTrendingPosts('month', 8);
        await getRecommendedPosts(12);
        await getSuggestedUsers();

        expect(fetchMock.mock.calls[0][0]).toContain('/posts/following?limit=20');
        expect(fetchMock.mock.calls[1][0]).toContain('/posts/trending?period=month&limit=8');
        expect(fetchMock.mock.calls[2][0]).toContain('/posts/recommended?limit=12');
        expect(fetchMock.mock.calls[3][0]).toContain('/users/suggested?limit=10');
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

    it('preserves the forbidden status from the access request', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 403,
            json: async () => ({ message: 'Forbidden' }),
        } as Response);

        await expect(checkAdminAccess()).rejects.toMatchObject({ status: 403 });
    });
});
