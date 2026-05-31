"use client";

import { getTagSuggestions } from "@/app/api/api";
import { TagSummary } from "@/app/types/user";
import { getCurrentTagQuery } from "@/app/utils/postTags";
import { useEffect, useMemo, useState } from "react";

interface TagSuggestionChipsProps {
    value: string;
    onSelect: (tag: string) => void;
}

export default function TagSuggestionChips({ value, onSelect }: TagSuggestionChipsProps) {
    const query = useMemo(() => getCurrentTagQuery(value).toLowerCase(), [value]);
    const [suggestions, setSuggestions] = useState<TagSummary[]>([]);

    const canSearch = query.length >= 2 && !/[^a-z0-9_-]/i.test(query);

    useEffect(() => {
        if (!canSearch) return;

        let cancelled = false;
        const timeoutId = window.setTimeout(() => {
            getTagSuggestions(query, 8)
                .then((items) => {
                    if (!cancelled) setSuggestions(items);
                })
                .catch(() => {
                    if (!cancelled) setSuggestions([]);
                });
        }, 250);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [canSearch, query]);

    const visibleSuggestions = canSearch ? suggestions : [];

    if (visibleSuggestions.length === 0) return null;

    return (
        <div className="mb-5 -mt-3 flex flex-wrap gap-2" aria-label="Tag suggestions">
            {visibleSuggestions.map((suggestion) => (
                <button
                    key={suggestion.tag}
                    type="button"
                    onClick={() => onSelect(suggestion.tag)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-[#9CC4E4] hover:bg-[#E9F2F9] hover:text-[#1B325F]"
                >
                    #{suggestion.tag}
                    <span className="ml-1 font-medium text-slate-400">{suggestion.postsCount}</span>
                </button>
            ))}
        </div>
    );
}
