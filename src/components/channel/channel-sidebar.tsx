"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, Volume2, Plus, Settings, ChevronDown, UserPlus, LogOut, Copy, Check, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Channel } from "@/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ChannelSidebarProps {
    serverName: string;
    serverId?: string;
    channels: Channel[];
    currentChannelId: string | null;
    onChannelClick: (channelId: string) => void;
    onCreateChannel: () => void;
    canManageChannels: boolean;
}



export function ChannelSidebar({
    serverName,
    serverId,
    channels,
    currentChannelId,
    onChannelClick,
    onCreateChannel,
    canManageChannels,
}: ChannelSidebarProps) {
    const router = useRouter();
    const { user, clearUser, setActiveVoiceChannelId, voiceStates, isAudioEnabled, isVideoEnabled, toggleAudio, toggleVideo } = useAppStore(); // Get voiceStates from store
    // const voiceStates = useVoiceState(); // Remove local hook
    const [showDropdown, setShowDropdown] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [copied, setCopied] = useState(false);
    const [isCreatingInvite, setIsCreatingInvite] = useState(false);

    const textChannels = channels.filter((c) => c.type === "TEXT");
    const voiceChannels = channels.filter((c) => c.type === "VOICE");

    const handleChannelInteraction = (channelId: string, type: "TEXT" | "VOICE") => {
        if (type === "VOICE") {
            setActiveVoiceChannelId(channelId);
        }
        onChannelClick(channelId);
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            clearUser();
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleCreateInvite = async () => {
        if (!serverId) return;
        setIsCreatingInvite(true);
        try {
            const res = await fetch(`/api/servers/${serverId}/invites`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ maxAge: 86400 }), // 24 hours
            });
            const data = await res.json();
            if (data.invite) {
                setInviteCode(data.invite.code);
            }
        } catch (error) {
            console.error("Failed to create invite:", error);
        } finally {
            setIsCreatingInvite(false);
        }
    };

    const handleCopyInvite = () => {
        const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openInviteModal = () => {
        setShowDropdown(false);
        setShowInviteModal(true);
        handleCreateInvite();
    };

    return (
        <div className="flex flex-col w-60 h-full bg-[hsl(var(--channel-bg))]">
            {/* Server header with dropdown */}
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center justify-between w-full px-4 h-12 border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors"
                >
                    <span className="font-semibold truncate">{serverName}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showDropdown && "rotate-180")} />
                </button>

                {/* Dropdown menu */}
                {showDropdown && (
                    <div className="absolute top-full left-2 right-2 mt-1 bg-[hsl(var(--popover))] rounded-md shadow-lg border border-[hsl(var(--border))] z-50 overflow-hidden">
                        <button
                            onClick={openInviteModal}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            Invite People
                        </button>
                        {canManageChannels && (
                            <button
                                onClick={() => {
                                    setShowDropdown(false);
                                    onCreateChannel();
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create Channel
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Channels */}
            <ScrollArea className="flex-1">
                <div className="px-2 py-4">
                    {/* Text Channels */}
                    <ChannelSection
                        label="Text Channels"
                        channels={textChannels}
                        currentChannelId={currentChannelId}
                        onChannelClick={(id) => handleChannelInteraction(id, "TEXT")}
                        onCreateChannel={onCreateChannel}
                        canManageChannels={canManageChannels}
                        icon={Hash}
                    />

                    {/* Voice Channels */}
                    <ChannelSection
                        label="Voice Channels"
                        channels={voiceChannels}
                        currentChannelId={currentChannelId}
                        onChannelClick={(id) => handleChannelInteraction(id, "VOICE")}
                        onCreateChannel={onCreateChannel}
                        canManageChannels={canManageChannels}
                        icon={Volume2}
                        voiceStates={voiceStates}
                    />
                </div>
            </ScrollArea>

            {/* User panel at bottom */}
            <div className="flex items-center gap-2 px-2 py-2 bg-[hsl(var(--background))] border-t border-[hsl(var(--border))]">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white font-semibold text-sm">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.username}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">Online</p>
                </div>

                {/* Media Controls */}
                <div className="flex items-center gap-1">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={toggleAudio}
                                    className="p-1.5 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                                >
                                    {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-500" />}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>{isAudioEnabled ? "Mute" : "Unmute"}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={toggleVideo}
                                    className="p-1.5 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                                >
                                    {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-red-500" />}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>{isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleLogout}
                                    className="p-1.5 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Log Out</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Invite Modal */}
            <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite friends to {serverName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            Share this link with others to grant access to your server!
                        </p>
                        {isCreatingInvite ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="w-6 h-6 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : inviteCode ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inviteCode}`}
                                    className="flex-1 px-3 py-2 bg-[hsl(var(--input))] rounded-md text-sm"
                                />
                                <Button onClick={handleCopyInvite} variant="discord">
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        ) : (
                            <p className="text-red-400 text-sm">Failed to create invite</p>
                        )}
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            This invite link expires in 24 hours.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface ChannelSectionProps {
    label: string;
    channels: Channel[];
    currentChannelId: string | null;
    onChannelClick: (channelId: string) => void;
    onCreateChannel: () => void;
    canManageChannels: boolean;
    icon: React.ComponentType<{ className?: string }>;
    voiceStates?: Record<string, any[]>;
}

function ChannelSection({
    label,
    channels,
    currentChannelId,
    onChannelClick,
    onCreateChannel,
    canManageChannels,
    icon: Icon,
    voiceStates,
}: ChannelSectionProps) {
    return (
        <div className="mb-4">
            <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] cursor-pointer">
                    {label}
                </span>
                {canManageChannels && (
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={onCreateChannel}
                                    className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Create Channel</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            <div className="space-y-0.5">
                {channels.map((channel) => (
                    <div key={channel.id}>
                        <button
                            onClick={() => onChannelClick(channel.id)}
                            className={cn(
                                "channel-item w-full group mb-1",
                                currentChannelId === channel.id && "active"
                            )}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="truncate">{channel.name}</span>
                            {canManageChannels && (
                                <Settings className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </button>

                        {/* Display Voice Participants */}
                        {voiceStates && voiceStates[channel.id] && voiceStates[channel.id].length > 0 && (
                            <div className="pl-8 pb-2 space-y-1">
                                {voiceStates[channel.id].map((user: any) => (
                                    <div key={user.userId} className="flex items-center gap-2 group/user cursor-pointer p-1 rounded hover:bg-[hsl(var(--accent))]">
                                        <div className="w-6 h-6 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white text-[10px] ring-2 ring-[hsl(var(--background))]">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                user.username.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <span className="text-sm font-medium text-[hsl(var(--muted-foreground))] group-hover/user:text-[hsl(var(--foreground))] truncate">
                                            {user.username}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
