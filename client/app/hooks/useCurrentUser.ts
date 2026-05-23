'use client';

import { useSyncExternalStore } from 'react';
import { IUser } from '@/app/types/user';

const AUTH_CHANGE_EVENT = 'auth:change';

function subscribe(onStoreChange: () => void) {
    window.addEventListener('storage', onStoreChange);
    window.addEventListener(AUTH_CHANGE_EVENT, onStoreChange);

    return () => {
        window.removeEventListener('storage', onStoreChange);
        window.removeEventListener(AUTH_CHANGE_EVENT, onStoreChange);
    };
}

function getSnapshot() {
    return localStorage.getItem('user');
}

function getServerSnapshot() {
    return null;
}

export function notifyAuthChanged() {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function useCurrentUser(): IUser | null {
    const serializedUser = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    if (!serializedUser) return null;

    try {
        return JSON.parse(serializedUser) as IUser;
    } catch {
        return null;
    }
}
