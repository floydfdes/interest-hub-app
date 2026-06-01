'use client';

import { searchUsers } from '@/app/api/api';
import { IUser } from '@/app/types/user';
import { Avatar } from 'antd';
import { useEffect, useMemo, useState } from 'react';

interface MentionSuggestionsProps {
    value: string;
    onChange: (value: string) => void;
}

function getMentionQuery(value: string) {
    const match = value.match(/(^|\s)@([a-zA-Z0-9_]{1,30})$/);
    return match?.[2] || '';
}

function applyMention(value: string, username: string) {
    return value.replace(/(^|\s)@([a-zA-Z0-9_]{1,30})$/, `$1@${username} `);
}

export default function MentionSuggestions({ value, onChange }: MentionSuggestionsProps) {
    const query = useMemo(() => getMentionQuery(value), [value]);
    const [users, setUsers] = useState<IUser[]>([]);
    const canSearch = query.length >= 1;

    useEffect(() => {
        if (!canSearch) return;
        let cancelled = false;
        const timeoutId = window.setTimeout(() => {
            searchUsers(query)
                .then((items) => { if (!cancelled) setUsers(items.filter((user) => user.username)); })
                .catch(() => { if (!cancelled) setUsers([]); });
        }, 250);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [canSearch, query]);

    const visibleUsers = canSearch ? users.slice(0, 5) : [];
    if (visibleUsers.length === 0) return null;

    return (
        <div className="mb-3 mt-2 flex flex-wrap gap-2" aria-label="Mention suggestions">
            {visibleUsers.map((user) => (
                <button
                    key={user._id}
                    type="button"
                    onClick={() => onChange(applyMention(value, user.username || user.name))}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#9CC4E4] hover:bg-[#E9F2F9] hover:text-[#1B325F]"
                >
                    <Avatar src={user.profilePic || null} size={20}>{user.name.charAt(0)}</Avatar>
                    @{user.username}
                </button>
            ))}
        </div>
    );
}
