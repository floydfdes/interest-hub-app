'use client';

import { useSyncExternalStore } from 'react';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'theme';
const THEME_CHANGE_EVENT = 'theme:change';

function preferredTheme(): ThemeMode {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function storedTheme(): ThemeMode {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'dark' || value === 'light' ? value : preferredTheme();
}

function applyTheme(theme: ThemeMode) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
}

function subscribe(onStoreChange: () => void) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onStorage = (event: StorageEvent) => {
        if (event.key === THEME_KEY) {
            applyTheme(storedTheme());
            onStoreChange();
        }
    };
    const onPreferenceChange = () => {
        if (!localStorage.getItem(THEME_KEY)) {
            applyTheme(preferredTheme());
            onStoreChange();
        }
    };

    window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.addEventListener('storage', onStorage);
    media.addEventListener('change', onPreferenceChange);

    return () => {
        window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
        window.removeEventListener('storage', onStorage);
        media.removeEventListener('change', onPreferenceChange);
    };
}

function getSnapshot(): ThemeMode {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function getServerSnapshot(): ThemeMode {
    return 'light';
}

export function setTheme(theme: ThemeMode) {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function useTheme(): ThemeMode {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
