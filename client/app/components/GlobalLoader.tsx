"use client";

import { useEffect, useState } from "react";

export default function GlobalLoader() {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const show = () => setLoading(true);
        const hide = () => setLoading(false);
        window.addEventListener("loader:start", show);
        window.addEventListener("loader:stop", hide);
        return () => {
            window.removeEventListener("loader:start", show);
            window.removeEventListener("loader:stop", hide);
        };
    }, []);

    if (!loading) return null;

    return <div className="fixed top-0 left-0 w-full h-1 bg-primary animate-pulse z-50" />;
}
