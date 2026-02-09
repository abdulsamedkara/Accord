"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (userId?: string) => {
    // If socket exists but we want to upgrade to authenticated (or switch user)
    if (socket && userId) {
        const currentQuery = socket.io.opts.query;
        // socket.io opts.query can be string or object. handling object here.
        const currentUserId = typeof currentQuery === 'object' ? currentQuery?.userId : undefined;

        if (currentUserId !== userId) {
            console.log("[Socket] Switching user, disconnecting old socket");
            socket.disconnect();
            socket = null;
        }
    }

    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
            path: "/api/socket/io",
            addTrailingSlash: false,
            query: userId ? { userId } : undefined,
        });

        socket.on("connect", () => {
            console.log("[Socket] Connected", socket?.id);
        });

        socket.on("disconnect", () => {
            console.log("[Socket] Disconnected");
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

// Socket event types
export interface SocketEvents {
    // Messages
    "message:new": (message: SocketMessage) => void;
    "message:update": (message: SocketMessage) => void;
    "message:delete": (data: { messageId: string; channelId: string }) => void;

    // Typing
    "typing:start": (data: TypingData) => void;
    "typing:stop": (data: TypingData) => void;
    "typing:update": (data: { channelId: string; users: TypingUser[] }) => void;

    // Channel
    "channel:join": (channelId: string) => void;
    "channel:leave": (channelId: string) => void;

    // Connection
    connect: () => void;
    disconnect: () => void;

    // Presence
    "presence:state": (data: { onlineUsers: string[] }) => void;
    "presence:update": (data: { userId: string; isOnline: boolean }) => void;
}

interface SocketMessage {
    id: string;
    content: string;
    channelId: string;
    userId: string;
    user: {
        id: string;
        username: string;
        avatar: string | null;
    };
    createdAt: string;
    updatedAt: string;
    deleted: boolean;
    fileUrl: string | null;
}

interface TypingData {
    channelId: string;
    userId: string;
    username: string;
}

interface TypingUser {
    id: string;
    username: string;
}
