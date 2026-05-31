import EditPostPage from '@/app/explore/post/[id]/edit/page';
import { getPostById, getPostComments, updatePost } from '@/app/api/api';
import { IPost } from '@/app/types/user';
import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const push = jest.fn();

jest.mock('next/navigation', () => ({
    useParams: () => ({ id: 'post-1' }),
    useRouter: () => ({ push }),
}));

jest.mock('@/app/hooks/useCurrentUser', () => ({
    useCurrentUser: () => ({ _id: 'author-1' }),
}));

jest.mock('@/app/api/imageUtil', () => ({
    compressAndConvertToBase64: jest.fn(),
    resizeImageToBase64: jest.fn(),
}));

jest.mock('@/app/api/api', () => ({
    createComment: jest.fn(),
    deleteComment: jest.fn(),
    deleteReply: jest.fn(),
    editComment: jest.fn(),
    editReply: jest.fn(),
    getErrorMessage: (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback,
    getPostById: jest.fn(),
    getPostComments: jest.fn(),
    getTagSuggestions: jest.fn(() => Promise.resolve([])),
    likeComment: jest.fn(),
    likeReply: jest.fn(),
    replyToComment: jest.fn(),
    unlikeComment: jest.fn(),
    updatePost: jest.fn(),
}));

const mockedGetPostById = jest.mocked(getPostById);
const mockedGetPostComments = jest.mocked(getPostComments);
const mockedUpdatePost = jest.mocked(updatePost);

const post = {
    _id: 'post-1',
    title: 'Original title',
    content: 'Original content',
    category: 'Tech',
    tags: [],
    image: 'https://example.com/image.png',
    visibility: 'public',
    comments: [],
    likes: [],
    author: { _id: 'author-1', name: 'Floyd', profilePic: '' },
    createdAt: '2026-05-30T00:00:00.000Z',
    updatedAt: '2026-05-30T00:00:00.000Z',
} as unknown as IPost;

describe('EditPostPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.setItem('token', 'test-token');
        mockedGetPostById.mockResolvedValue(post);
        mockedGetPostComments.mockResolvedValue({
            items: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
        });
        mockedUpdatePost.mockResolvedValue(post);
    });

    it('omits tags when the edit tag field is empty', async () => {
        render(<App><EditPostPage /></App>);

        expect(await screen.findByDisplayValue('Original title')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('edit-post-submit'));

        await waitFor(() => expect(mockedUpdatePost).toHaveBeenCalledWith('post-1', expect.not.objectContaining({ tags: expect.anything() })));
        expect(push).toHaveBeenCalledWith('/explore');
    });


    it('validates tag format before updating', async () => {
        render(<App><EditPostPage /></App>);

        expect(await screen.findByDisplayValue('Original title')).toBeInTheDocument();
        fireEvent.change(screen.getByTestId('edit-post-tags'), { target: { value: 'travel photography' } });
        fireEvent.click(screen.getByTestId('edit-post-submit'));

        expect(await screen.findAllByText('Tags can only use letters, numbers, underscores, and hyphens.')).not.toHaveLength(0);
        expect(mockedUpdatePost).not.toHaveBeenCalled();
    });

    it('shows backend update errors to the user', async () => {
        mockedUpdatePost.mockRejectedValue(new Error('Tags cannot be empty'));
        render(<App><EditPostPage /></App>);

        expect(await screen.findByDisplayValue('Original title')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('edit-post-submit'));

        expect(await screen.findAllByText('Tags cannot be empty')).not.toHaveLength(0);
        expect(push).not.toHaveBeenCalled();
    });
});
