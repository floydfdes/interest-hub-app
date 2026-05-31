import { applyTagSuggestion, parseAndValidateTags, parseTagInput } from '@/app/utils/postTags';

describe('post tag utilities', () => {
    it('normalizes comma-separated tag input and removes duplicates', () => {
        expect(parseTagInput(' Travel, tech, TRAVEL, ui-kit ')).toEqual(['travel', 'tech', 'ui-kit']);
    });

    it('allows empty tags because tags are optional', () => {
        expect(parseAndValidateTags('')).toEqual({ tags: [], error: '' });
    });

    it('rejects invalid tag values before submit', () => {
        expect(parseAndValidateTags('travel photography').error).toBe('Tags can only use letters, numbers, underscores, and hyphens.');
        expect(parseAndValidateTags('null').error).toBe('Tag cannot be "null".');
        expect(parseAndValidateTags('one,two,three,four,five,six,seven,eight,nine,ten,eleven').error).toBe('Use 10 tags or fewer.');
    });

    it('applies a suggestion to the current tag segment', () => {
        expect(applyTagSuggestion('react, tra', 'travel')).toBe('react, travel');
    });
});
