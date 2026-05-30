import { bookmarkPost, removeBookmark } from '@/app/api/api';
import { IUser } from '@/app/types/user';
import BookmarkButton from '@/components/features/BookmarkButton';
import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    bookmarkPost: jest.fn(),
    removeBookmark: jest.fn(),
}));

const user = { _id: 'user-1' } as IUser;
const mockedBookmarkPost = jest.mocked(bookmarkPost);
const mockedRemoveBookmark = jest.mocked(removeBookmark);

describe('BookmarkButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedBookmarkPost.mockResolvedValue({ message: 'Post bookmarked' });
        mockedRemoveBookmark.mockResolvedValue({ message: 'Bookmark removed' });
    });

    it('optimistically marks a post saved and notifies after the API succeeds', async () => {
        const onBookmarkChange = jest.fn();
        render(
            <App>
                <BookmarkButton postId="post-1" currentUser={user} onBookmarkChange={onBookmarkChange} showLabel />
            </App>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Bookmark post' }));

        expect(screen.getByRole('button', { name: 'Remove bookmark' })).toBeInTheDocument();
        await waitFor(() => expect(mockedBookmarkPost).toHaveBeenCalledWith('post-1'));
        expect(onBookmarkChange).toHaveBeenCalledWith('post-1', true);
    });

    it('removes an existing bookmark', async () => {
        render(
            <App>
                <BookmarkButton postId="post-2" currentUser={user} initialBookmarked showLabel />
            </App>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Remove bookmark' }));

        await waitFor(() => expect(mockedRemoveBookmark).toHaveBeenCalledWith('post-2'));
        expect(screen.getByRole('button', { name: 'Bookmark post' })).toBeInTheDocument();
    });
});
