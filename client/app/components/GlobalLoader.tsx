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

    return (
        <div className="fixed left-0 top-0 z-[100] h-1 w-full overflow-hidden bg-indigo-100">
            <div className="h-full w-1/2 animate-pulse rounded-r-full bg-gradient-to-r from-indigo-500 to-cyan-400" />
        </div>
    );
}
