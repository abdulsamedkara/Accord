"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { ChannelSidebar } from "@/components/channel/channel-sidebar";
import { CreateChannelModal } from "@/components/channel/create-channel-modal";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { MediaRoom } from "@/components/media-room";
import { ServerMemberSidebar } from "@/components/server/server-member-sidebar";
import { useSocketMessages } from "@/realtime/hooks";
import { MessageWithUser, ServerWithMembers, Channel } from "@/types";
import { Loader2 } from "lucide-react";

interface ChannelPageProps {
    params: Promise<{
        serverId: string;
        channelId: string;
    }>;
}

export default function ChannelPage({ params }: ChannelPageProps) {
    const resolvedParams = use(params);
    const { serverId, channelId } = resolvedParams;
    const router = useRouter();
    const {
        user,
        servers,
        setServers,
        messages,
        setMessages,
        typingUsers,
        currentChannelId,
        setCurrentChannel,
    } = useAppStore();

    const [currentServer, setCurrentServer] = useState<ServerWithMembers | null>(null);
    const [currentChannel, setLocalCurrentChannel] = useState<Channel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [createChannelOpen, setCreateChannelOpen] = useState(false);

    const { sendMessage, sendSocketMessage, startTyping, stopTyping } = useSocketMessages(channelId);

    // Set current channel ID on mount
    useEffect(() => {
        setCurrentChannel(channelId);
        return () => setCurrentChannel(null);
    }, [channelId, setCurrentChannel]);

    // Fetch data
    useEffect(() => {
        const server = servers.find((s) => s.id === serverId);
        if (server) {
            setCurrentServer(server);
            const channel = server.channels.find((c) => c.id === channelId);
            if (channel) {
                setLocalCurrentChannel(channel);
            }
        }

        // Fetch messages
        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/channels/${channelId}/messages`);
                const data = await res.json();
                if (data.messages) {
                    setMessages(data.messages);
                }
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessages();
    }, [serverId, channelId, servers, setMessages]);

    // If we land on an AUDIO channel page directly, ensure it becomes the active voice channel
    useEffect(() => {
        if (currentChannel?.type === "VOICE") {
            const { activeVoiceChannelId, setActiveVoiceChannelId } = useAppStore.getState();
            if (activeVoiceChannelId !== channelId) {
                setActiveVoiceChannelId(channelId);
            }
        }
    }, [currentChannel, channelId]);

    // Find current member role
    const currentMember = currentServer?.members.find((m) => m.userId === user?.id);
    const canManageChannels = currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";

    const handleChannelClick = (newChannelId: string) => {
        router.push(`/servers/${serverId}/channels/${newChannelId}`);
    };

    const handleSendMessage = async (content: string) => {
        if (!user) return;

        try {
            const res = await fetch(`/api/channels/${channelId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            const data = await res.json();
            if (data.message) {
                // Create full message object
                const messageWithUser: MessageWithUser = {
                    ...data.message,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        avatar: user.avatar,
                        createdAt: user.createdAt,
                        updatedAt: user.createdAt,
                    },
                };

                // Add to local state
                useAppStore.getState().addMessage(messageWithUser);

                // Broadcast to other users via socket
                // Send as JSON string which server will parse and broadcast
                sendSocketMessage(JSON.stringify(messageWithUser));
            }
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleEditMessage = async (messageId: string, content: string) => {
        try {
            const res = await fetch(`/api/messages/${messageId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            if (res.ok) {
                useAppStore.getState().updateMessage(messageId, content);
            }
        } catch (error) {
            console.error("Failed to edit message:", error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            const res = await fetch(`/api/messages/${messageId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                useAppStore.getState().deleteMessage(messageId);
            }
        } catch (error) {
            console.error("Failed to delete message:", error);
        }
    };

    const refreshChannels = async () => {
        try {
            const res = await fetch("/api/servers");
            const data = await res.json();
            if (data.servers) {
                setServers(data.servers);
            }
        } catch (error) {
            console.error("Failed to refresh servers:", error);
        }
    };

    if (!currentServer || !currentChannel) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[hsl(var(--chat-bg))]">
                <p className="text-[hsl(var(--muted-foreground))]">Loading...</p>
            </div>
        );
    }

    return (
        <>
            {/* Channel Sidebar */}
            <ChannelSidebar
                serverName={currentServer.name}
                serverId={serverId}
                channels={currentServer.channels}
                currentChannelId={channelId}
                onChannelClick={handleChannelClick}
                onCreateChannel={() => setCreateChannelOpen(true)}
                canManageChannels={canManageChannels}
            />

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-[hsl(var(--chat-bg))]">
                <ChatHeader
                    channel={currentChannel}
                    memberCount={currentServer.members.length}
                />

                {currentChannel.type === "TEXT" ? (
                    <>
                        <MessageList
                            messages={messages}
                            currentUserId={user?.id || ""}
                            onEditMessage={handleEditMessage}
                            onDeleteMessage={handleDeleteMessage}
                        />

                        <TypingIndicator users={typingUsers.filter((u) => u.id !== user?.id)} />

                        <ChatInput
                            channelName={currentChannel.name}
                            onSendMessage={handleSendMessage}
                            onTypingStart={startTyping}
                            onTypingStop={stopTyping}
                        />
                    </>
                ) : (
                    <div
                        id="channel-video-portal"
                        className="flex-1 flex items-center justify-center bg-black/80 relative overflow-hidden"
                    >
                        <div className="flex flex-col items-center gap-y-4 animate-in fade-in duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin relative z-10" />
                            </div>
                            <p className="text-sm font-medium text-zinc-400 animate-pulse">
                                Connecting to secure voice...
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <ServerMemberSidebar members={currentServer.members} />

            <CreateChannelModal
                open={createChannelOpen}
                onOpenChange={setCreateChannelOpen}
                serverId={serverId}
                onSuccess={refreshChannels}
            />
        </>
    );
}
