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
    isUserSettingsModalOpen: boolean;
    setUserSettingsModalOpen: (open: boolean) => void;

    // Voice
    activeVoiceChannelId: string | null;
    setActiveVoiceChannelId: (id: string | null) => void;
    voiceStates: Record<string, any[]>;
    setVoiceStates: (states: Record<string, any[]>) => void;
    updateVoiceState: (channelId: string, users: any[]) => void;

    // Audio/Video Settings
    isAudioEnabled: boolean; // Microphone
    isVideoEnabled: boolean; // Camera
    isDeafened: boolean; // Headphone (Deafen)
    audioInputDeviceId: string | undefined;
    audioOutputDeviceId: string | undefined;
    videoDeviceId: string | undefined;
    noiseSuppression: boolean;
    echoCancellation: boolean;
    autoGainControl: boolean;

    // Volume Control
    userVolumes: Record<string, number>; // userId -> volume (0-100)
    setUserVolume: (userId: string, volume: number) => void;

    speakingUsers: Record<string, boolean>; // Map of userId -> isSpeaking

    toggleAudio: () => void;
    toggleVideo: () => void;
    toggleDeafened: () => void;
    setAudioEnabled: (enabled: boolean) => void;
    setVideoEnabled: (enabled: boolean) => void;
    setDeafened: (enabled: boolean) => void;

    setAudioInputDeviceId: (id: string) => void;
    setAudioOutputDeviceId: (id: string) => void;
    setVideoDeviceId: (id: string) => void;
    setNoiseSuppression: (enabled: boolean) => void;
    setEchoCancellation: (enabled: boolean) => void;
    setAutoGainControl: (enabled: boolean) => void;

    inputVolume: number;
    inputSensitivity: number;
    isInputSensitivityAuto: boolean;
    inputMode: "voice-activity" | "push-to-talk";
    pushToTalkKey: string | null;
    toggleMuteKey: string | null;

    setInputVolume: (volume: number) => void;
    setInputSensitivity: (sensitivity: number) => void;
    setInputSensitivityAuto: (auto: boolean) => void;
    setInputMode: (mode: "voice-activity" | "push-to-talk") => void;
    setPushToTalkKey: (key: string | null) => void;
    setToggleMuteKey: (key: string | null) => void;

    setSpeakingUsers: (users: Record<string, boolean>) => void;
    updateSpeakingUser: (userId: string, isSpeaking: boolean) => void;

    // Presence
    onlineUsers: Set<string>;
    setOnlineUsers: (userIds: string[]) => void;
    addOnlineUser: (userId: string) => void;
    removeOnlineUser: (userId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    // ... (previous state) ...
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
    isUserSettingsModalOpen: false,
    setUserSettingsModalOpen: (open) => set({ isUserSettingsModalOpen: open }),

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
    isAudioEnabled: true,
    isVideoEnabled: false,
    isDeafened: false,
    audioInputDeviceId: undefined,
    audioOutputDeviceId: undefined,
    videoDeviceId: undefined,
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,

    userVolumes: {},
    setUserVolume: (userId, volume) => set((state) => ({
        userVolumes: { ...state.userVolumes, [userId]: volume }
    })),

    speakingUsers: {},

    toggleAudio: () => set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),
    toggleVideo: () => set((state) => ({ isVideoEnabled: !state.isVideoEnabled })),
    toggleDeafened: () => set((state) => ({ isDeafened: !state.isDeafened })),

    setAudioEnabled: (enabled) => set({ isAudioEnabled: enabled }),
    setVideoEnabled: (enabled) => set({ isVideoEnabled: enabled }),
    setDeafened: (enabled) => set({ isDeafened: enabled }),

    setAudioInputDeviceId: (id) => set({ audioInputDeviceId: id }),
    setAudioOutputDeviceId: (id) => set({ audioOutputDeviceId: id }),
    setVideoDeviceId: (id) => set({ videoDeviceId: id }),
    setNoiseSuppression: (enabled) => set({ noiseSuppression: enabled }),
    setEchoCancellation: (enabled) => set({ echoCancellation: enabled }),
    setAutoGainControl: (enabled) => set({ autoGainControl: enabled }),

    inputVolume: 100,
    inputSensitivity: 50,
    isInputSensitivityAuto: true,
    inputMode: "voice-activity",
    pushToTalkKey: null,
    toggleMuteKey: null,

    setInputVolume: (volume) => set({ inputVolume: volume }),
    setInputSensitivity: (sensitivity) => set({ inputSensitivity: sensitivity }),
    setInputSensitivityAuto: (auto) => set({ isInputSensitivityAuto: auto }),
    setInputMode: (mode) => set({ inputMode: mode }),
    setPushToTalkKey: (key) => set({ pushToTalkKey: key }),
    setToggleMuteKey: (key) => set({ toggleMuteKey: key }),

    setSpeakingUsers: (users) => set({ speakingUsers: users }),
    updateSpeakingUser: (userId, isSpeaking) => set((state) => ({
        speakingUsers: {
            ...state.speakingUsers,
            [userId]: isSpeaking
        }
    })),

    // Presence
    onlineUsers: new Set<string>(),
    setOnlineUsers: (userIds: string[]) => set({ onlineUsers: new Set<string>(userIds) }),
    addOnlineUser: (userId: string) => set((state) => ({ onlineUsers: new Set<string>(state.onlineUsers).add(userId) })),
    removeOnlineUser: (userId: string) => set((state) => {
        const newSet = new Set<string>(state.onlineUsers);
        newSet.delete(userId);
        return { onlineUsers: newSet };
    }),
}));
