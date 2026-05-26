import { hidePost } from '@/app/api/api';
import { IPost, IUser } from '@/app/types/user';
import PostCard from '@/components/features/PostCard';
import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    bookmarkPost: jest.fn(),
    hidePost: jest.fn(),
    likePost: jest.fn(),
    removeBookmark: jest.fn(),
    unlikePost: jest.fn(),
}));

const mockedHidePost = jest.mocked(hidePost);

describe('PostCard hide action', () => {
    it('hides another user post and removes it from its visible feed owner', async () => {
        mockedHidePost.mockResolvedValue({ message: 'Post hidden' });
        const onHide = jest.fn();
        const post = {
            _id: 'post-2',
            title: 'Quiet this post',
            content: 'Post content',
            author: { _id: 'user-2', name: 'Jordan', profilePic: '' },
            likes: [],
            comments: [],
        } as unknown as IPost;

        render(
            <App>
                <PostCard post={post} currentUser={{ _id: 'me' } as IUser} onHide={onHide} />
            </App>
        );

        expect(screen.queryByRole('button', { name: 'Hide post' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'More post actions' }));
        expect(screen.getByRole('button', { name: 'Hide post' })).toBeInTheDocument();
        fireEvent.mouseDown(document.body);
        expect(screen.queryByRole('button', { name: 'Hide post' })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'More post actions' }));
        fireEvent.click(screen.getByRole('button', { name: 'Hide post' }));

        await waitFor(() => expect(mockedHidePost).toHaveBeenCalledWith('post-2'));
        expect(onHide).toHaveBeenCalledWith('post-2');
    });
});
