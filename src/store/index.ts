import { create } from "zustand";
import { SafeUser, ServerWithMembers, Channel, MessageWithUser, TypingUser } from "@/types";

interface AppState {
    // User
    user: SafeUser | null;
    setUser: (user: SafeUser | null) => void;
    clearUser: () => void;

    // Servers
    servers: ServerWithMembers[];
    setServers: (servers: ServerWithMembers[]) => void;
    addServer: (server: ServerWithMembers) => void;
    updateServer: (serverId: string, data: Partial<ServerWithMembers>) => void;
    removeServer: (serverId: string) => void;

    // Current selection
    currentServerId: string | null;
    currentChannelId: string | null;
    setCurrentServer: (serverId: string | null) => void;
    setCurrentChannel: (channelId: string | null) => void;

    // Channels
    channels: Channel[];
    setChannels: (channels: Channel[]) => void;
    addChannel: (channel: Channel) => void;
    removeChannel: (channelId: string) => void;

    // Messages
    messages: MessageWithUser[];
    setMessages: (messages: MessageWithUser[]) => void;
    addMessage: (message: MessageWithUser) => void;
    updateMessage: (messageId: string, content: string) => void;
    deleteMessage: (messageId: string) => void;

    // Typing
    typingUsers: TypingUser[];
    setTypingUsers: (users: TypingUser[]) => void;

    // UI State
    isMobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    isCreateServerModalOpen: boolean;
    setCreateServerModalOpen: (open: boolean) => void;
    isCreateChannelModalOpen: boolean;
    setCreateChannelModalOpen: (open: boolean) => void;

    // Voice
    activeVoiceChannelId: string | null;
    setActiveVoiceChannelId: (id: string | null) => void;
    voiceStates: Record<string, any[]>;
    setVoiceStates: (states: Record<string, any[]>) => void;
    updateVoiceState: (channelId: string, users: any[]) => void;

    // Media Preferences
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    toggleAudio: () => void;
    toggleVideo: () => void;
    setAudioEnabled: (enabled: boolean) => void;
    setVideoEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    // User
    user: null,
    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null, servers: [], messages: [], typingUsers: [], activeVoiceChannelId: null }),

    // Servers
    servers: [],
    setServers: (servers) => set({ servers }),
    addServer: (server) => set((state) => ({ servers: [...state.servers, server] })),
    updateServer: (serverId, data) =>
        set((state) => ({
            servers: state.servers.map((s) =>
                s.id === serverId ? { ...s, ...data } : s
            ),
        })),
    removeServer: (serverId) =>
        set((state) => ({
            servers: state.servers.filter((s) => s.id !== serverId),
        })),

    // Current selection
    currentServerId: null,
    currentChannelId: null,
    setCurrentServer: (serverId) => set({ currentServerId: serverId }),
    setCurrentChannel: (channelId) => set({ currentChannelId: channelId }),

    // Channels
    channels: [],
    setChannels: (channels) => set({ channels }),
    addChannel: (channel) => set((state) => ({ channels: [...state.channels, channel] })),
    removeChannel: (channelId) =>
        set((state) => ({
            channels: state.channels.filter((c) => c.id !== channelId),
        })),

    // Messages
    messages: [],
    setMessages: (messages) => set({ messages }),
    addMessage: (message) =>
        set((state) => {
            // Check if message already exists to prevent duplicates
            if (state.messages.some(m => m.id === message.id)) {
                return state;
            }
            return { messages: [...state.messages, message] };
        }),
    updateMessage: (messageId, content) =>
        set((state) => ({
            messages: state.messages.map((m) =>
                m.id === messageId ? { ...m, content, updatedAt: new Date() } : m
            ),
        })),
    deleteMessage: (messageId) =>
        set((state) => ({
            messages: state.messages.map((m) =>
                m.id === messageId ? { ...m, deleted: true, content: "This message has been deleted" } : m
            ),
        })),

    // Typing
    typingUsers: [],
    setTypingUsers: (users) => set({ typingUsers: users }),

    // UI State
    isMobileMenuOpen: false,
    setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
    isCreateServerModalOpen: false,
    setCreateServerModalOpen: (open) => set({ isCreateServerModalOpen: open }),
    isCreateChannelModalOpen: false,
    setCreateChannelModalOpen: (open) => set({ isCreateChannelModalOpen: open }),

    // Voice
    activeVoiceChannelId: null,
    setActiveVoiceChannelId: (channelId) => set({ activeVoiceChannelId: channelId }),
    voiceStates: {},
    setVoiceStates: (voiceStates) => set({ voiceStates }),
    updateVoiceState: (channelId, users) => set((state) => ({
        voiceStates: {
            ...state.voiceStates,
            [channelId]: users
        }
    })),

    // Media Preferences
    isAudioEnabled: true, // Default to true
    isVideoEnabled: false, // Default to false
    toggleAudio: () => set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),
    toggleVideo: () => set((state) => ({ isVideoEnabled: !state.isVideoEnabled })),
    setAudioEnabled: (enabled) => set({ isAudioEnabled: enabled }),
    setVideoEnabled: (enabled) => set({ isVideoEnabled: enabled }),
}));
