"use client";

import { useEffect, useState } from "react";

export const TitleBar = () => {
    // Only show on client/electron
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="h-8 w-full flex items-center px-2 bg-[#1e1f22] select-none app-drag shrink-0 fixed top-0 left-0 right-0 z-[9999]">
            {/* Logo and Title */}
            <div className="flex items-center gap-2 px-2">
                <div className="w-4 h-4 relative">
                    <img src="/logo.ico" alt="Accord" className="w-full h-full object-contain" />
                </div>
                <span className="text-xs font-bold text-[#b5bac1] font-sans">Accord</span>
            </div>

            {/* The rest is empty space for dragging */}
        </div>
    );
};
