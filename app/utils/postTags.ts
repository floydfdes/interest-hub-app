const TAG_PATTERN = /^[a-z0-9_-]+$/;
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

export function parseTagInput(value: string) {
    const seen = new Set<string>();

    return value
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .filter((tag) => {
            if (seen.has(tag)) return false;
            seen.add(tag);
            return true;
        });
}

export function validateTags(tags: string[]) {
    if (tags.length > MAX_TAGS) return `Use ${MAX_TAGS} tags or fewer.`;

    const invalidTag = tags.find((tag) => {
        const normalized = tag.trim().toLowerCase();
        return (
            normalized === "null" ||
            normalized.length > MAX_TAG_LENGTH ||
            !TAG_PATTERN.test(normalized)
        );
    });

    if (!invalidTag) return "";
    if (invalidTag.length > MAX_TAG_LENGTH) return "Each tag must be 30 characters or fewer.";
    if (invalidTag.trim().toLowerCase() === "null") return 'Tag cannot be "null".';
    return "Tags can only use letters, numbers, underscores, and hyphens.";
}

export function parseAndValidateTags(value: string) {
    const tags = parseTagInput(value);
    return {
        tags,
        error: validateTags(tags),
    };
}

export function getCurrentTagQuery(value: string) {
    const parts = value.split(',');
    return (parts.at(-1) || "").trim();
}

export function applyTagSuggestion(value: string, tag: string) {
    const parts = value.split(',');
    parts[parts.length - 1] = ` ${tag}`;
    return parts
        .join(',')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .join(', ');
}
