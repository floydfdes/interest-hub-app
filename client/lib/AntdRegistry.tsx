'use client';

import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import type Entity from '@ant-design/cssinjs/es/Cache';
import { App, ConfigProvider } from 'antd';
import { useServerInsertedHTML } from 'next/navigation';
import React from 'react';

const StyledComponentsRegistry = ({ children }: React.PropsWithChildren) => {
    const cache = React.useMemo<Entity>(() => createCache(), []);
    useServerInsertedHTML(() => (
        <style id="antd" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />
    ));
    return (
        <StyleProvider cache={cache}>
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: '#4f46e5',
                        colorInfo: '#4f46e5',
                        colorText: '#101828',
                        colorTextSecondary: '#667085',
                        borderRadius: 12,
                        borderRadiusLG: 18,
                        controlHeightLG: 48,
                        fontFamily: 'Inter, "Avenir Next", Arial, sans-serif',
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
