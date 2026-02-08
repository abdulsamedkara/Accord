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
}

// Store voice participants per channel
// channelId -> Map<socketId, VoiceState>
const voiceStates = new Map<string, Map<string, VoiceState>>();

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
        console.log("Socket connected:", socket.id);

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

        // Handle new message - broadcast to all in channel except sender
        socket.on("message:send", (data: string | MessageData) => {
            try {
                // Data can be JSON string (full message) or MessageData object
                let messageToSend;
                let channelId: string;

                if (typeof data === 'string') {
                    messageToSend = JSON.parse(data);
                    channelId = messageToSend.channelId;
                } else {
                    messageToSend = data;
                    channelId = data.channelId;
                }

                // Broadcast to all in channel except sender
                socket.to(channelId).emit("message:new", messageToSend);
            } catch (error) {
                console.error("Error broadcasting message:", error);
            }
        });

        // Handle message update
        socket.on("message:update", (data: { messageId: string; channelId: string; content: string }) => {
            socket.to(data.channelId).emit("message:update", data);
        });

        // Handle message delete
        socket.on("message:delete", (data: { messageId: string; channelId: string }) => {
            socket.to(data.channelId).emit("message:delete", data);
        });

        // Handle typing start
        socket.on("typing:start", (data: TypingData) => {
            if (!channelTypingUsers.has(data.channelId)) {
                channelTypingUsers.set(data.channelId, new Map());
            }

            const typingUsers = channelTypingUsers.get(data.channelId)!;
            typingUsers.set(data.userId, { id: data.userId, username: data.username });

            // Broadcast typing users to channel
            io.to(data.channelId).emit("typing:update", {
                channelId: data.channelId,
                users: Array.from(typingUsers.values()),
            });
        });

        // Handle typing stop
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

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);

            // Clean up typing users
            channelTypingUsers.forEach((users, channelId) => {
                // In a real app we would map socket.id to user.id to clean up efficiently
            });

            // Clean up voice state for this socket
            handleVoiceDisconnect(socket.id, io);
        });

        // Voice Events
        socket.on("voice:join", (data: { channelId: string; user: any }) => {
            const { channelId, user } = data;
            console.log(`[Voice] Socket ${socket.id} joining channel ${channelId}`, user.username);

            // Allow user to be in only one voice channel at a time
            // Remove from other channels first
            handleVoiceDisconnect(socket.id, io);

            if (!voiceStates.has(channelId)) {
                voiceStates.set(channelId, new Map());
            }

            const channelVoiceStates = voiceStates.get(channelId)!;
            channelVoiceStates.set(socket.id, {
                userId: user.id,
                username: user.username,
                avatar: user.avatar,
                socketId: socket.id
            });

            socket.join(`voice:${channelId}`);

            // Broadcast update to all clients (for sidebar)
            io.emit("voice:state-update", {
                channelId,
                users: Array.from(channelVoiceStates.values())
            });
        });

        socket.on("voice:leave", (channelId: string) => {
            socket.leave(`voice:${channelId}`);

            if (voiceStates.has(channelId)) {
                const channelVoiceStates = voiceStates.get(channelId)!;
                channelVoiceStates.delete(socket.id);

                // Broadcast update
                io.emit("voice:state-update", {
                    channelId,
                    users: Array.from(channelVoiceStates.values())
                });

                if (channelVoiceStates.size === 0) {
                    voiceStates.delete(channelId);
                }
            }
        });
    });

    return io;
}

// Helper to handle voice disconnection
function handleVoiceDisconnect(socketId: string, io?: SocketIOServer) {
    voiceStates.forEach((users, channelId) => {
        if (users.has(socketId)) {
            users.delete(socketId);

            if (io) {
                // Broadcast update
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
