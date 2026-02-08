"use client";

import { useEffect, useState } from "react";
import { getSocket, disconnectSocket } from "@/realtime/socket";
import { useAppStore } from "@/store";
import { MessageWithUser, TypingUser } from "@/types";
import type { Socket } from "socket.io-client";

export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socketInstance = getSocket();
        setSocket(socketInstance);

        socketInstance.on("connect", () => {
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            setIsConnected(false);
        });

        return () => {
            // Don't disconnect on unmount - keep connection alive
        };
    }, []);

    return { socket, isConnected };
}

export function useSocketMessages(channelId: string | null) {
    const { socket } = useSocket();
    const { addMessage, updateMessage, deleteMessage, setTypingUsers } = useAppStore();

    useEffect(() => {
        if (!socket || !channelId) return;

        // Join channel room
        socket.emit("channel:join", channelId);

        // Listen for new messages
        const handleNewMessage = (message: MessageWithUser) => {
            if (message.channelId === channelId) {
                addMessage(message);
            }
        };

        // Listen for message updates
        const handleUpdateMessage = (message: MessageWithUser) => {
            if (message.channelId === channelId) {
                updateMessage(message.id, message.content);
            }
        };

        // Listen for message deletes
        const handleDeleteMessage = (data: { messageId: string; channelId: string }) => {
            if (data.channelId === channelId) {
                deleteMessage(data.messageId);
            }
        };

        // Listen for typing updates
        const handleTypingUpdate = (data: { channelId: string; users: TypingUser[] }) => {
            if (data.channelId === channelId) {
                setTypingUsers(data.users);
            }
        };

        socket.on("message:new", handleNewMessage);
        socket.on("message:update", handleUpdateMessage);
        socket.on("message:delete", handleDeleteMessage);
        socket.on("typing:update", handleTypingUpdate);

        return () => {
            socket.emit("channel:leave", channelId);
            socket.off("message:new", handleNewMessage);
            socket.off("message:update", handleUpdateMessage);
            socket.off("message:delete", handleDeleteMessage);
            socket.off("typing:update", handleTypingUpdate);
        };
    }, [socket, channelId, addMessage, updateMessage, deleteMessage, setTypingUsers]);

    const sendMessage = (content: string) => {
        if (socket && channelId) {
            socket.emit("message:send", { channelId, content });
        }
    };

    const sendSocketMessage = (data: any) => {
        if (socket && channelId) {
            socket.emit("message:send", data);
        }
    };

    const startTyping = () => {
        if (socket && channelId) {
            const { user } = useAppStore.getState();
            if (user) {
                socket.emit("typing:start", {
                    channelId,
                    userId: user.id,
                    username: user.username
                });
            }
        }
    };

    const stopTyping = () => {
        if (socket && channelId) {
            const { user } = useAppStore.getState();
            if (user) {
                socket.emit("typing:stop", {
                    channelId,
                    userId: user.id,
                    username: user.username
                });
            }
        }
    };

    return { sendMessage, sendSocketMessage, startTyping, stopTyping };
}

export function useVoiceState() {
    const { socket } = useSocket();
    const [voiceStates, setVoiceStates] = useState<Record<string, any[]>>({});

    useEffect(() => {
        if (!socket) return;

        socket.on("voice:state-update", (data: { channelId: string; users: any[] }) => {
            console.log("[VoiceHook] Received update:", data);
            setVoiceStates(prev => ({
                ...prev,
                [data.channelId]: data.users
            }));
        });

        return () => {
            socket.off("voice:state-update");
        };
    }, [socket]);

    return voiceStates;
}
