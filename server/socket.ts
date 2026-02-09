import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

interface TypingUser {
    id: string;
    username: string;
}

interface MessageData {
    channelId: string;
    content: string;
}

interface TypingData {
    channelId: string;
    userId: string;
    username: string;
}

// Store typing users per channel
const channelTypingUsers = new Map<string, Map<string, TypingUser>>();

interface VoiceState {
    userId: string;
    username: string;
    avatar: string | null;
    socketId: string;
    isMuted: boolean;
    isCameraOn: boolean;
    isDeafened: boolean;
}

// Store voice participants per channel
// channelId -> Map<socketId, VoiceState>
const voiceStates = new Map<string, Map<string, VoiceState>>();

// Store online users: userId -> Set<socketId>
const onlineUsers = new Map<string, Set<string>>();

export function initSocketServer(httpServer: HTTPServer) {
    const io = new SocketIOServer(httpServer, {
        path: "/api/socket/io",
        addTrailingSlash: false,
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId as string | undefined;

        if (userId) {
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
                // User just came online (first tab)
                io.emit("presence:update", { userId, isOnline: true });
            }
            onlineUsers.get(userId)!.add(socket.id);
            console.log(`Socket connected: ${socket.id} (User: ${userId})`);
        } else {
            console.log(`Socket connected (Guest): ${socket.id}`);
        }

        // Send current online users to the new client
        const onlineUserIds = Array.from(onlineUsers.keys());
        socket.emit("presence:state", { onlineUsers: onlineUserIds });

        // Send existing voice states to the new client
        voiceStates.forEach((users, channelId) => {
            socket.emit("voice:state-update", {
                channelId,
                users: Array.from(users.values())
            });
        });

        // Join channel room
        socket.on("channel:join", (channelId: string) => {
            socket.join(channelId);
            console.log(`Socket ${socket.id} joined channel ${channelId}`);
        });

        // Leave channel room
        socket.on("channel:leave", (channelId: string) => {
            socket.leave(channelId);
            console.log(`Socket ${socket.id} left channel ${channelId}`);
        });

        // Handle new message
        socket.on("message:send", (data: string | MessageData) => {
            try {
                let messageToSend;
                let channelId: string;

                if (typeof data === 'string') {
                    messageToSend = JSON.parse(data);
                    channelId = messageToSend.channelId;
                } else {
                    messageToSend = data;
                    channelId = data.channelId;
                }

                socket.to(channelId).emit("message:new", messageToSend);
            } catch (error) {
                console.error("Error broadcasting message:", error);
            }
        });

        // Handle message updates
        socket.on("message:update", (data: { messageId: string; channelId: string; content: string }) => {
            socket.to(data.channelId).emit("message:update", data);
        });

        socket.on("message:delete", (data: { messageId: string; channelId: string }) => {
            socket.to(data.channelId).emit("message:delete", data);
        });

        // Typing
        socket.on("typing:start", (data: TypingData) => {
            if (!channelTypingUsers.has(data.channelId)) {
                channelTypingUsers.set(data.channelId, new Map());
            }

            const typingUsers = channelTypingUsers.get(data.channelId)!;
            typingUsers.set(data.userId, { id: data.userId, username: data.username });

            io.to(data.channelId).emit("typing:update", {
                channelId: data.channelId,
                users: Array.from(typingUsers.values()),
            });
        });

        socket.on("typing:stop", (data: TypingData) => {
            const typingUsers = channelTypingUsers.get(data.channelId);
            if (typingUsers) {
                typingUsers.delete(data.userId);

                io.to(data.channelId).emit("typing:update", {
                    channelId: data.channelId,
                    users: Array.from(typingUsers.values()),
                });
            }
        });

        // Voice Events
        socket.on("voice:join", (data: { channelId: string; user: any; isMuted?: boolean; isCameraOn?: boolean; isDeafened?: boolean }) => {
            const { channelId, user, isMuted = false, isCameraOn = false, isDeafened = false } = data;

            handleVoiceDisconnect(socket.id, io);

            if (!voiceStates.has(channelId)) {
                voiceStates.set(channelId, new Map());
            }

            const channelVoiceStates = voiceStates.get(channelId)!;
            channelVoiceStates.set(socket.id, {
                userId: user.id,
                username: user.username,
                avatar: user.avatar,
                socketId: socket.id,
                isMuted,
                isCameraOn,
                isDeafened
            });

            socket.join(`voice:${channelId}`);

            io.emit("voice:state-update", {
                channelId,
                users: Array.from(channelVoiceStates.values())
            });
        });

        socket.on("voice:state-change", (data: { channelId: string; isMuted: boolean; isCameraOn: boolean; isDeafened: boolean }) => {
            const { channelId, isMuted, isCameraOn, isDeafened } = data;

            if (voiceStates.has(channelId)) {
                const channelVoiceStates = voiceStates.get(channelId)!;
                const userState = channelVoiceStates.get(socket.id);

                if (userState) {
                    userState.isMuted = isMuted;
                    userState.isCameraOn = isCameraOn;
                    userState.isDeafened = isDeafened;
                    channelVoiceStates.set(socket.id, userState);

                    io.emit("voice:state-update", {
                        channelId,
                        users: Array.from(channelVoiceStates.values())
                    });
                }
            }
        });

        socket.on("voice:leave", (channelId: string) => {
            socket.leave(`voice:${channelId}`);
            handleVoiceDisconnect(socket.id, io);
        });

        // Disconnect
        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);

            // Handle Presence
            if (userId && onlineUsers.has(userId)) {
                const userSockets = onlineUsers.get(userId)!;
                userSockets.delete(socket.id);

                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit("presence:update", { userId, isOnline: false });
                }
            }

            // Clean up voice
            handleVoiceDisconnect(socket.id, io);
        });
    });

    return io;
}

function handleVoiceDisconnect(socketId: string, io?: SocketIOServer) {
    voiceStates.forEach((users, channelId) => {
        if (users.has(socketId)) {
            users.delete(socketId);

            if (io) {
                io.emit("voice:state-update", {
                    channelId,
                    users: Array.from(users.values())
                });
            }

            if (users.size === 0) {
                voiceStates.delete(channelId);
            }
        }
    });
}
