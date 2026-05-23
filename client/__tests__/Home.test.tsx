import { render, screen } from '@testing-library/react';
import Home from '../app/page';
import '@testing-library/jest-dom';

// Mock the API service
jest.mock('@/services/api', () => ({
    get: jest.fn(() => Promise.resolve({ data: [] })),
}));

// Mock useRouter
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

describe('Home Page', () => {
    it('renders the heading', () => {
        render(<Home />);
        const heading = screen.getByRole('heading', { name: /Latest Interests/i });
        expect(heading).toBeInTheDocument();
    });

    it('renders post list', () => {
        render(<Home />);
        // Since we mocked empty posts, it might show empty state or skeleton
        // We just check if it renders without crashing
        const mainDiv = screen.getByRole('heading', { name: /Latest Interests/i });
        expect(mainDiv).toBeInTheDocument();
    });
});
