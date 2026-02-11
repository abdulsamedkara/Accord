import { useEffect, useState, useRef } from "react";
import { ActiveCallView } from "@/components/voice/active-call-view";
import { LiveKitRoom, VideoConference, useLocalParticipant, RoomAudioRenderer, useRemoteParticipants, useRoomContext, ControlBar } from "@livekit/components-react";
import { RoomEvent, VideoPresets } from "livekit-client";
import "@livekit/components-styles";
import { useAppStore } from "@/store";
import { useSocket } from "@/realtime/hooks";
import { Loader2, WifiOff } from "lucide-react";
import { ScreenSharePicker } from "@/components/voice/screen-share-picker";

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
    const { user, isAudioEnabled, isVideoEnabled, isDeafened } = useAppStore();
    const { socket } = useSocket();
    const [token, setToken] = useState("");
    const [isDisconnected, setIsDisconnected] = useState(false);

    useEffect(() => {
        if (!user?.id || !user?.username) return;

        const userId = user.id;
        const username = user.username;

        (async () => {
            try {
                const resp = await fetch(
                    `/api/livekit?room=${chatId}&userId=${userId}&username=${username}`
                );
                const data = await resp.json();
                setToken(data.token);
            } catch (e) {
                console.error(e);
            }
        })();
    }, [user?.id, user?.username, chatId]);

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
                },
                isMuted: !isAudioEnabled,
                isCameraOn: isVideoEnabled
            });
        }

        return () => {
            if (!isDisconnected) {
                socket.emit("voice:leave", chatId);
            }
        };
    }, [socket, chatId, user, isDisconnected]); // Removed isAudioEnabled/isVideoEnabled dependencies to prevent re-joining

    const handleRejoin = () => {
        setIsDisconnected(false);
        // Force token refresh or just let the connect prop handle it?
        // LiveKitRoom with connect={true} should reconnect.
    };

    if (isDisconnected) {
        return (
            <div className="flex flex-col flex-1 justify-center items-center bg-[#1e1f22] p-4">
                <div className="flex flex-col items-center max-w-xs w-full text-center">
                    {/* Animated disconnected icon */}
                    <div className="relative mb-8">
                        <div className="w-20 h-20 rounded-full bg-[#2b2d31] flex items-center justify-center">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16.5 12A4.5 4.5 0 0 0 12 7.5M20 12a8 8 0 0 0-8-8" stroke="#5865F2" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                                <path d="M4.93 4.93l14.14 14.14" stroke="#ed4245" strokeWidth="2.5" strokeLinecap="round" />
                                <circle cx="12" cy="12" r="2" fill="#b5bac1" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-[22px] font-bold text-white mb-2">Ses Bağlantısı Kesildi</h2>
                    <p className="text-[#b5bac1] mb-8 text-sm leading-relaxed">
                        Ses kanalından ayrıldınız.
                    </p>

                    <button
                        onClick={handleRejoin}
                        className="w-full py-2.5 px-4 bg-[#5865F2] hover:bg-[#4752c4] text-white text-sm font-medium rounded-[4px] transition-colors"
                    >
                        Yeniden Bağlan
                    </button>
                </div>
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
            video={isVideoEnabled ? { resolution: VideoPresets.h1080.resolution } : false}
            audio={{ echoCancellation: true, noiseSuppression: true, autoGainControl: true }}
            onDisconnected={() => {
                setIsDisconnected(true);
                if (socket) {
                    socket.emit("voice:leave", chatId);
                }
            }}
        >
            <div className="flex flex-col h-full w-full">
                <div className="flex-1 overflow-hidden">
                    <ActiveCallView />
                </div>
                {/* Control Bar */}
                <div className="h-[80px] flex items-center justify-center p-4 bg-zinc-950 border-t border-zinc-800">
                    <ControlBar variation="minimal" />
                </div>
            </div>

            {/* Global Audio Renderer Removed - Handled individually in ParticipantTile for volume control */}
            {/* Global Audio Renderer Removed - Handled individually in ParticipantTile for volume control */}
            <MediaController chatId={chatId} />
            <ScreenSharePicker />
        </LiveKitRoom>
    );
};

function MediaController({ chatId }: { chatId: string }) {
    const {
        isAudioEnabled,
        isVideoEnabled,
        setAudioEnabled,
        setVideoEnabled,
        isDeafened,
        updateSpeakingUser,
        toggleAudio,
        audioInputDeviceId,
        audioOutputDeviceId,
        videoDeviceId,
        noiseSuppression,
        echoCancellation,
        inputMode,
        pushToTalkKey,
        toggleMuteKey,
        inputVolume
    } = useAppStore();
    const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
    const remoteParticipants = useRemoteParticipants();
    const { socket } = useSocket();
    const lastStoreUpdate = useRef(0);
    const room = useRoomContext();

    // 0. Handle Device Switching and Keybinds
    useEffect(() => {
        if (!room) return;
        if (audioInputDeviceId) room.switchActiveDevice("audioinput", audioInputDeviceId);
    }, [room, audioInputDeviceId]);

    useEffect(() => {
        if (!room) return;
        if (audioOutputDeviceId) room.switchActiveDevice("audiooutput", audioOutputDeviceId);
    }, [room, audioOutputDeviceId]);

    useEffect(() => {
        if (!room) return;
        if (videoDeviceId) room.switchActiveDevice("videoinput", videoDeviceId);
    }, [room, videoDeviceId]);

    // Handle Global Keybinds (PTT and Mute Toggle)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return; // Prevent triggering while typing

            // Toggle Mute
            if (toggleMuteKey && e.code === toggleMuteKey && !e.repeat) {
                toggleAudio();
            }

            // Push to Talk
            if (inputMode === "push-to-talk" && pushToTalkKey && e.code === pushToTalkKey) {
                if (!isAudioEnabled) {
                    setAudioEnabled(true);
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (inputMode === "push-to-talk" && pushToTalkKey && e.code === pushToTalkKey) {
                setAudioEnabled(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [inputMode, pushToTalkKey, toggleMuteKey, isAudioEnabled, setAudioEnabled, toggleAudio]);

    // Use toggleAudio for keybind
    // I need to add `toggleAudio` to destructuring.

    // 1. Store -> LiveKit
    useEffect(() => {
        if (!localParticipant) return;
        if (isAudioEnabled !== isMicrophoneEnabled) {
            lastStoreUpdate.current = Date.now();
            localParticipant.setMicrophoneEnabled(isAudioEnabled, {
                deviceId: audioInputDeviceId,
                noiseSuppression: noiseSuppression,
                echoCancellation: echoCancellation,
            });
        }
    }, [isAudioEnabled, localParticipant, audioInputDeviceId, noiseSuppression, echoCancellation]);

    useEffect(() => {
        // Apply input volume updates?
        // LiveKit doesn't support Input Volume on LocalTrack directly cleanly.
        // But we can try to use standard constraints if re-acquiring track.
        // Or just ignore for now as decided.
        // But I should trigger logic if I can.
    }, [inputVolume]);

    useEffect(() => {
        if (!localParticipant) return;
        if (isVideoEnabled !== isCameraEnabled) {
            lastStoreUpdate.current = Date.now();
            localParticipant.setCameraEnabled(isVideoEnabled, {
                deviceId: videoDeviceId
            });
        }
    }, [isVideoEnabled, localParticipant, videoDeviceId]);

    // 2. LiveKit -> Store (User clicked Room UI)
    useEffect(() => {
        if (Date.now() - lastStoreUpdate.current < 500) return;

        if (isMicrophoneEnabled !== isAudioEnabled) {
            setAudioEnabled(isMicrophoneEnabled);
        }
    }, [isMicrophoneEnabled, isAudioEnabled, setAudioEnabled]);

    useEffect(() => {
        if (Date.now() - lastStoreUpdate.current < 500) return;

        if (isCameraEnabled !== isVideoEnabled) {
            setVideoEnabled(isCameraEnabled);
        }
    }, [isCameraEnabled, isVideoEnabled, setVideoEnabled]);

    // 3. Sync with Socket Server for Sidebar Icons and Deafen state (if we want to show headphones icon to others)
    useEffect(() => {
        if (socket) {
            socket.emit("voice:state-change", {
                channelId: chatId,
                isMuted: !isAudioEnabled,
                isCameraOn: isVideoEnabled,
                isDeafened: isDeafened,
            });
        }
    }, [socket, chatId, isAudioEnabled, isVideoEnabled, isDeafened]);

    // 4. Track Active Speakers
    useEffect(() => {
        if (!room) return;

        const onActiveSpeakersChanged = (speakers: any[]) => {
            const speakingMap: Record<string, boolean> = {};
            speakers.forEach(speaker => {
                if (speaker.identity) {
                    speakingMap[speaker.identity] = true;
                }
            });
            // Bulk update to ensure we clear those who stopped speaking
            // We need to add setSpeakingUsers to the store destructuring first
            // But wait, the store has `setSpeakingUsers`.
            useAppStore.getState().setSpeakingUsers(speakingMap);
        };

        room.on(RoomEvent.ActiveSpeakersChanged, onActiveSpeakersChanged);

        return () => {
            room.off(RoomEvent.ActiveSpeakersChanged, onActiveSpeakersChanged);
        };
    }, [room]);

    return null;
}
