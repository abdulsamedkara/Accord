"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
            path: "/api/socket/io",
            addTrailingSlash: false,
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
