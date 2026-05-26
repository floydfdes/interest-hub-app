import HiddenPostsPage from '@/app/profile/hidden-posts/page';
import { getHiddenPosts, unhidePost } from '@/app/api/api';
import { IPost } from '@/app/types/user';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    getHiddenPosts: jest.fn(),
    unhidePost: jest.fn(),
}));

const mockedGetHiddenPosts = jest.mocked(getHiddenPosts);
const mockedUnhidePost = jest.mocked(unhidePost);

describe('HiddenPostsPage', () => {
    it('loads hidden posts and removes one after unhiding', async () => {
        mockedGetHiddenPosts.mockResolvedValue({
            items: [{
                _id: 'post-2',
                title: 'Hidden post',
                image: '',
                author: { _id: 'user-2', name: 'Jordan', profilePic: '' },
            } as IPost],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        });
        mockedUnhidePost.mockResolvedValue({ message: 'Post unhidden' });

        render(<HiddenPostsPage />);

        expect(await screen.findByText('Hidden post')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Unhide' }));
        await waitFor(() => expect(mockedUnhidePost).toHaveBeenCalledWith('post-2'));
        expect(screen.queryByText('Hidden post')).not.toBeInTheDocument();
    });
});
