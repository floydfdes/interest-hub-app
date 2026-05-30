import { archivePost, hidePost, submitReport } from '@/app/api/api';
import { IPost, IUser } from '@/app/types/user';
import PostCard from '@/components/features/PostCard';
import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    bookmarkPost: jest.fn(),
    archivePost: jest.fn(),
    hidePost: jest.fn(),
    likePost: jest.fn(),
    removeBookmark: jest.fn(),
    submitReport: jest.fn(),
    unlikePost: jest.fn(),
}));

const mockedHidePost = jest.mocked(hidePost);
const mockedArchivePost = jest.mocked(archivePost);
const mockedSubmitReport = jest.mocked(submitReport);

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

    it('archives an owned post from the overflow menu', async () => {
        mockedArchivePost.mockResolvedValue({ message: 'Post archived', post: { _id: 'post-2', isArchived: true, archivedAt: '2026-05-27T00:00:00.000Z' } });
        const onArchive = jest.fn();
        const post = {
            _id: 'post-2',
            title: 'My post',
            content: 'Post content',
            author: { _id: 'me', name: 'Me', profilePic: '' },
            likes: [],
            comments: [],
        } as unknown as IPost;

        render(
            <App>
                <PostCard post={post} currentUser={{ _id: 'me' } as IUser} onArchive={onArchive} />
            </App>
        );

        fireEvent.click(screen.getByRole('button', { name: 'More post actions' }));
        fireEvent.click(screen.getByRole('button', { name: 'Archive' }));

        await waitFor(() => expect(mockedArchivePost).toHaveBeenCalledWith('post-2'));
        expect(onArchive).toHaveBeenCalledWith('post-2');
    });

    it('submits a report for another user post without hiding it', async () => {
        mockedSubmitReport.mockResolvedValue({
            _id: 'report-1',
            targetType: 'post',
            reason: 'harassment',
            status: 'pending',
            action: 'none',
        });
        const onHide = jest.fn();
        const post = {
            _id: 'post-3',
            title: 'Report this',
            content: 'Post content',
            author: { _id: 'user-2', name: 'Jordan', profilePic: '' },
            likes: [],
            comments: [],
        } as unknown as IPost;

        render(<App><PostCard post={post} currentUser={{ _id: 'me' } as IUser} onHide={onHide} /></App>);

        fireEvent.click(screen.getByRole('button', { name: 'More post actions' }));
        fireEvent.click(screen.getByRole('button', { name: 'Report' }));
        fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'harassment' } });
        fireEvent.click(screen.getByRole('button', { name: 'Submit report' }));

        await waitFor(() => expect(mockedSubmitReport).toHaveBeenCalledWith({
            targetType: 'post',
            targetId: 'post-3',
            reason: 'harassment',
        }));
        expect(onHide).not.toHaveBeenCalled();
    });
});
