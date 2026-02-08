"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { MediaRoom } from "@/components/media-room";
import { cn } from "@/lib/utils";

export const ActiveVoiceManager = () => {
    const { activeVoiceChannelId, currentChannelId } = useAppStore();
    const [position, setPosition] = useState<{ top: number, left: number, width: number, height: number } | null>(null);

    const isCurrentChannelVoice = activeVoiceChannelId === currentChannelId;

    useEffect(() => {
        if (!isCurrentChannelVoice) {
            setPosition(null);
            return;
        }

        const syncPosition = () => {
            const el = document.getElementById("channel-video-portal");
            if (el) {
                const rect = el.getBoundingClientRect();
                setPosition({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
            }
        };

        // Sync immediately
        syncPosition();

        // Sync on resize/scroll/mutation
        window.addEventListener("resize", syncPosition);
        window.addEventListener("scroll", syncPosition);

        // Also use a simple interval to catch layout changes (like sidebar open/close)
        const interval = setInterval(syncPosition, 100);

        return () => {
            window.removeEventListener("resize", syncPosition);
            window.removeEventListener("scroll", syncPosition);
            clearInterval(interval);
        };
    }, [isCurrentChannelVoice, currentChannelId]);

    // If no active voice channel, don't render anything
    if (!activeVoiceChannelId) return null;

    // IMPORTANT: We must keep MediaRoom mounted to maintain connection.
    // If we are not on the voice channel page, we just hide the container visually.
    const isVisible = isCurrentChannelVoice && position;

    return (
        <div
            style={isVisible && position ? {
                position: 'fixed',
                top: position.top,
                left: position.left,
                width: position.width,
                height: position.height,
                zIndex: 40,
                transition: "all 0.1s ease-in-out",
            } : {
                display: 'none'
            }}
            className="bg-background shadow-xl overflow-hidden"
        >
            <div className="w-full h-full">
                <MediaRoom
                    chatId={activeVoiceChannelId}
                    video={true}
                    audio={true}
                />
            </div>
        </div>
    );
}
