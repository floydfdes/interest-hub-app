import GlobalSearchPage from '@/app/search/page';
import { globalSearch } from '@/app/api/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/api/api', () => ({
    getErrorMessage: (_error: unknown, fallback: string) => fallback,
    globalSearch: jest.fn(),
}));

const push = jest.fn();
let queryParam = '';

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push }),
    useSearchParams: () => ({
        get: (key: string) => key === 'query' ? queryParam : null,
    }),
}));

const mockedGlobalSearch = jest.mocked(globalSearch);

describe('GlobalSearchPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        queryParam = '';
        mockedGlobalSearch.mockResolvedValue({
            query: 'travel',
            users: [{
                _id: 'user-1',
                name: 'Alex Travel',
                username: 'alex',
                email: 'alex@example.com',
                profilePic: '',
            } as never],
            posts: [{
                _id: 'post-1',
                title: 'Travel post',
                content: 'A trip note',
                image: '',
                likesCount: 2,
                commentsCount: 1,
            } as never],
            tags: [{ tag: 'travel', postsCount: 12 }],
        });
    });

    it('searches globally and renders user, post, and tag sections', async () => {
        render(<GlobalSearchPage />);

        fireEvent.change(screen.getByLabelText('Global search'), { target: { value: 'travel' } });
        fireEvent.submit(screen.getByLabelText('Global search').closest('form') as HTMLFormElement);

        await waitFor(() => expect(mockedGlobalSearch).toHaveBeenCalledWith('travel', 5));
        expect(push).toHaveBeenCalledWith('/search?query=travel');
        expect(await screen.findByText('Alex Travel')).toBeInTheDocument();
        expect(screen.getByText('Travel post')).toBeInTheDocument();
        expect(screen.getByText('#travel')).toBeInTheDocument();
    });

    it('requires at least two search characters', async () => {
        render(<GlobalSearchPage />);

        fireEvent.change(screen.getByLabelText('Global search'), { target: { value: 't' } });
        fireEvent.submit(screen.getByLabelText('Global search').closest('form') as HTMLFormElement);

        expect(await screen.findByText('Enter at least 2 characters to search.')).toBeInTheDocument();
        expect(mockedGlobalSearch).not.toHaveBeenCalled();
    });
});
