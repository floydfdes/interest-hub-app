'use client';

import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import type Entity from '@ant-design/cssinjs/es/Cache';
import { useTheme } from '@/app/hooks/useTheme';
import { App, ConfigProvider, theme as antdTheme } from 'antd';
import { useServerInsertedHTML } from 'next/navigation';
import React from 'react';

const StyledComponentsRegistry = ({ children }: React.PropsWithChildren) => {
    const cache = React.useMemo<Entity>(() => createCache(), []);
    const theme = useTheme();
    useServerInsertedHTML(() => (
        <style id="antd" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />
    ));
    return (
        <StyleProvider cache={cache}>
            <ConfigProvider
                theme={{
                    algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
                    token: {
                        colorPrimary: '#4f46e5',
                        colorInfo: '#4f46e5',
                        colorText: theme === 'dark' ? '#e5e7eb' : '#101828',
                        colorTextSecondary: theme === 'dark' ? '#94a3b8' : '#667085',
                        colorBgContainer: theme === 'dark' ? '#151d30' : '#ffffff',
                        colorBorder: theme === 'dark' ? '#2b3850' : '#e4e7ec',
                        borderRadius: 12,
                        borderRadiusLG: 18,
                        controlHeightLG: 48,
                        fontFamily: 'var(--font-inter), "Avenir Next", Arial, sans-serif',
                    },
                }}
            >
                <App>
                    {children}
                </App>
            </ConfigProvider>
        </StyleProvider>
    );
};

export default StyledComponentsRegistry;
