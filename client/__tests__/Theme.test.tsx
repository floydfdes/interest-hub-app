import { setTheme, useTheme } from '@/app/hooks/useTheme';
import { fireEvent, render, screen } from '@testing-library/react';

function ThemeToggleProbe() {
    const theme = useTheme();
    return (
        <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme}
        </button>
    );
}

describe('theme preference', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.dataset.theme = 'light';
        document.documentElement.style.colorScheme = 'light';
    });

    it('persists dark mode and updates the document theme', () => {
        render(<ThemeToggleProbe />);

        fireEvent.click(screen.getByRole('button', { name: 'light' }));

        expect(screen.getByRole('button', { name: 'dark' })).toBeInTheDocument();
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(document.documentElement.dataset.theme).toBe('dark');
        expect(document.documentElement.style.colorScheme).toBe('dark');
    });
});
