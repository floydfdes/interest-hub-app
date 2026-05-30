export function parseTagInput(value: string) {
    return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
}
