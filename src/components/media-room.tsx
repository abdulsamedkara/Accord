"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference, useLocalParticipant } from "@livekit/components-react";
import "@livekit/components-styles";
import { useAppStore } from "@/store";
import { useSocket } from "@/realtime/hooks";
import { Loader2 } from "lucide-react";

interface MediaRoomProps {
    chatId: string;
    video: boolean;
    audio: boolean;
}

export const MediaRoom = ({
    chatId,
    video, // keeping these as initial props if needed, but store overrides
    audio,
}: MediaRoomProps) => {
    const { user, isAudioEnabled, isVideoEnabled } = useAppStore();
    const { socket } = useSocket();
    const [token, setToken] = useState("");
    const [isDisconnected, setIsDisconnected] = useState(false);

    useEffect(() => {
        if (!user?.username) return;

        const name = user.username;

        (async () => {
            try {
                const resp = await fetch(
                    `/api/livekit?room=${chatId}&username=${name}`
                );
                const data = await resp.json();
                setToken(data.token);
            } catch (e) {
                console.error(e);
            }
        })();
    }, [user?.username, chatId]);

    useEffect(() => {
        if (!socket || !user || !chatId) return;

        // Only join if not explicitly disconnected in this session
        if (!isDisconnected) {
            socket.emit("voice:join", {
                channelId: chatId,
                user: {
                    id: user.id,
                    username: user.username,
                    avatar: user.avatar
                }
            });
        }

        return () => {
            if (!isDisconnected) {
                socket.emit("voice:leave", chatId);
            }
        };
    }, [socket, chatId, user, isDisconnected]);

    const handleRejoin = () => {
        setIsDisconnected(false);
        // Force token refresh or just let the connect prop handle it?
        // LiveKitRoom with connect={true} should reconnect.
    };

    if (isDisconnected) {
        return (
            <div className="flex flex-col flex-1 justify-center items-center bg-black/90">
                <p className="text-zinc-500 mb-4">You have disconnected.</p>
                <button
                    onClick={handleRejoin}
                    className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded hover:opacity-90 transition"
                >
                    Rejoin Voice Channel
                </button>
            </div>
        );
    }

    if (token === "") {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Loading...
                </p>
            </div>
        );
    }

    return (
        <LiveKitRoom
            data-lk-theme="default"
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            token={token}
            connect={!isDisconnected}
            video={isVideoEnabled}
            audio={isAudioEnabled}
            onDisconnected={() => {
                setIsDisconnected(true);
                if (socket) {
                    socket.emit("voice:leave", chatId);
                }
            }}
        >
            <VideoConference />
            <MediaController />
        </LiveKitRoom>
    );
};

function MediaController() {
    const {
        isAudioEnabled,
        isVideoEnabled,
        setAudioEnabled,
        setVideoEnabled
    } = useAppStore();
    const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();

    // 1. Store -> LiveKit (User clicked Sidebar)
    useEffect(() => {
        if (!localParticipant) return;
        // Only update if they differ to avoid loops, though strict dependency helps
        if (isAudioEnabled !== isMicrophoneEnabled) {
            localParticipant.setMicrophoneEnabled(isAudioEnabled);
        }
    }, [isAudioEnabled]); // Only trigger when Store changes

    useEffect(() => {
        if (!localParticipant) return;
        if (isVideoEnabled !== isCameraEnabled) {
            localParticipant.setCameraEnabled(isVideoEnabled);
        }
    }, [isVideoEnabled]); // Only trigger when Store changes

    // 2. LiveKit -> Store (User clicked Room UI)
    useEffect(() => {
        // Only trigger when LiveKit state changes
        // Use functional state update or simple check
        if (isMicrophoneEnabled !== isAudioEnabled) {
            setAudioEnabled(isMicrophoneEnabled);
        }
    }, [isMicrophoneEnabled]);

    useEffect(() => {
        if (isCameraEnabled !== isVideoEnabled) {
            setVideoEnabled(isCameraEnabled);
        }
    }, [isCameraEnabled]);

    return null;
}
