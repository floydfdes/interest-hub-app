import { render, screen } from '@testing-library/react';
import Home from '../app/page';
import '@testing-library/jest-dom';

jest.mock('@/app/api/api', () => ({
    getAllPosts: jest.fn(() => Promise.resolve([])),
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

describe('Home Page', () => {
    it('renders the heading', async () => {
        render(<Home />);
        const heading = screen.getByRole('heading', { name: /Latest Interests/i });
        expect(heading).toBeInTheDocument();
        expect(await screen.findByText(/No posts yet/i)).toBeInTheDocument();
    });

    it('renders post list', async () => {
        render(<Home />);
        expect(await screen.findByText(/No posts yet/i)).toBeInTheDocument();
    });
});
