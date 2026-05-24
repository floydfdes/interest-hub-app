import {
    bookmarkPost,
    getBookmarkedPosts,
    getFollowingPosts,
    getRecommendedPosts,
    getSuggestedUsers,
    getTrendingPosts,
    removeBookmark,
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
});
