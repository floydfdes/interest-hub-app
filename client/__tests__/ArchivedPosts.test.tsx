import ArchivedPostsPage from '@/app/profile/archived-posts/page';
import { getArchivedPosts, unarchivePost } from '@/app/api/api';
import { IPost } from '@/app/types/user';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    getArchivedPosts: jest.fn(),
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    unarchivePost: jest.fn(),
}));

const mockedGetArchivedPosts = jest.mocked(getArchivedPosts);
const mockedUnarchivePost = jest.mocked(unarchivePost);

describe('ArchivedPostsPage', () => {
    it('restores an archived post and removes it from archive view', async () => {
        mockedGetArchivedPosts.mockResolvedValue({
            items: [{ _id: 'post-1', title: 'Archived post', image: '', category: 'Design' } as IPost],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        });
        mockedUnarchivePost.mockResolvedValue({ message: 'Post unarchived', post: { _id: 'post-1', isArchived: false, archivedAt: null } });

        render(<ArchivedPostsPage />);
        expect(await screen.findByText('Archived post')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Unarchive' }));

        await waitFor(() => expect(mockedUnarchivePost).toHaveBeenCalledWith('post-1'));
        expect(screen.queryByText('Archived post')).not.toBeInTheDocument();
    });
});
