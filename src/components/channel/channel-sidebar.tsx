"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, Volume2, Plus, Settings, ChevronDown, UserPlus, LogOut, Copy, Check, Mic, MicOff, Video, VideoOff, Headphones, HeadphoneOff, Maximize2 } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as SliderPrimitive from "@radix-ui/react-slider";

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
    const {
        user,
        clearUser,
        setActiveVoiceChannelId,
        voiceStates,
        isAudioEnabled,
        isVideoEnabled,
        isDeafened,
        toggleAudio,
        toggleVideo,
        toggleDeafened,
        speakingUsers,
        setUserSettingsModalOpen,
        servers,
        removeServer
    } = useAppStore();

    const [showDropdown, setShowDropdown] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [copied, setCopied] = useState(false);
    const [isCreatingInvite, setIsCreatingInvite] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    const textChannels = channels.filter((c) => c.type === "TEXT");
    const voiceChannels = channels.filter((c) => c.type === "VOICE");

    const currentServer = servers.find((s) => s.id === serverId);
    const isOwner = currentServer?.ownerId === user?.id;

    const handleChannelInteraction = (channelId: string, type: "TEXT" | "VOICE") => {
        if (type === "VOICE") {
            setActiveVoiceChannelId(channelId);
        }
        onChannelClick(channelId);
    };

    const handleLeaveServer = async () => {
        if (!serverId) return;
        if (isOwner) {
            alert("Founders cannot leave their own server. You must delete the server instead.");
            return;
        }

        if (!confirm(`Are you sure you want to leave ${serverName}?`)) return;

        setIsLeaving(true);
        try {
            const res = await fetch(`/api/servers/${serverId}/leave`, {
                method: "POST",
            });

            if (res.ok) {
                removeServer(serverId);
                router.push("/");
            } else {
                console.error("Failed to leave server");
            }
        } catch (error) {
            console.error("Leave server error:", error);
        } finally {
            setIsLeaving(false);
        }
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

                        {!isOwner && (
                            <button
                                onClick={handleLeaveServer}
                                disabled={isLeaving}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-[hsl(var(--accent))] transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                {isLeaving ? "Leaving..." : "Leave Server"}
                            </button>
                        )}

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-[hsl(var(--accent))] transition-colors border-t border-[hsl(var(--border))]"
                        >
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </button>
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
                        speakingUsers={{}}
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
                        speakingUsers={speakingUsers}
                        userVolumes={useAppStore((state) => state.userVolumes)}
                        setUserVolume={useAppStore((state) => state.setUserVolume)}
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
                                    onClick={toggleDeafened}
                                    className="p-1.5 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                                >
                                    {isDeafened ? <HeadphoneOff className="w-4 h-4 text-red-500" /> : <Headphones className="w-4 h-4" />}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>{isDeafened ? "Undeafen" : "Deafen"}</TooltipContent>
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
                                    className="p-1.5 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors"
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
                                <Button onClick={handleCopyInvite} variant="default">
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
    speakingUsers?: Record<string, boolean>;
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
    speakingUsers = {},
    userVolumes,
    setUserVolume,
}: ChannelSectionProps & { userVolumes?: Record<string, number>, setUserVolume?: (id: string, vol: number) => void }) {
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
                                "flex items-center gap-2 px-2 py-1 rounded-md transition-colors",
                                "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]",
                                currentChannelId === channel.id && "bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]"
                            )}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate font-medium">{channel.name}</span>
                            {canManageChannels && (
                                <Settings className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </button>

                        {/* Display Voice Participants */}
                        {voiceStates && voiceStates[channel.id] && voiceStates[channel.id].length > 0 && (
                            <div className="pl-6 pb-1 space-y-0.5 mt-1">
                                {voiceStates[channel.id].map((user: any) => (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div key={user.userId} className="flex items-center gap-2 group/user cursor-pointer p-1 rounded hover:bg-[hsl(var(--accent)/50)] relative">
                                                <div className={cn(
                                                    "relative w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] transition-all",
                                                    user.avatar ? "" : "bg-[hsl(var(--primary))]",
                                                    speakingUsers && speakingUsers[user.userId] && "ring-2 ring-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]"
                                                )}>
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        user.username.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-medium text-[hsl(var(--muted-foreground))] group-hover/user:text-[hsl(var(--foreground))] truncate",
                                                    speakingUsers && speakingUsers[user.userId] && "text-[hsl(var(--foreground))]"
                                                )}>
                                                    {user.username}
                                                </span>
                                                <div className="flex items-center gap-0.5 ml-auto">
                                                    {user.isMuted && (
                                                        <MicOff className="w-3 h-3 text-red-500" />
                                                    )}
                                                    {user.isDeafened && (
                                                        <HeadphoneOff className="w-3 h-3 text-red-500" />
                                                    )}
                                                    {user.isCameraOn && (
                                                        <Video className="w-3 h-3 text-[hsl(var(--primary))]" />
                                                    )}
                                                </div>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-80 p-0 border-0 overflow-hidden rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                                            side="right"
                                            align="start"
                                            sideOffset={16}
                                        >
                                            {/* Glassmorphic Background Container */}
                                            <div className="relative flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/10 h-full">

                                                {/* Animated Gradient Header */}
                                                <div className="relative h-24 p-5 flex items-center gap-4 border-b border-white/5 overflow-hidden group">
                                                    {/* Animated Background Mesh */}
                                                    <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient-xy" />
                                                    <div className="absolute inset-0 bg-black/40" />

                                                    {/* Avatar with Glow */}
                                                    <div className="relative">
                                                        <div className={cn(
                                                            "absolute -inset-1 rounded-full blur-md opacity-50 bg-gradient-to-br from-indigo-500 to-purple-500",
                                                            speakingUsers[user.userId] && "opacity-100 animate-pulse"
                                                        )} />
                                                        <Avatar className="relative h-14 w-14 border-2 border-white/10 shadow-xl">
                                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
                                                            <AvatarFallback className="bg-zinc-800 text-white font-bold text-lg">
                                                                {user.username.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </div>

                                                    {/* User Info */}
                                                    <div className="relative flex flex-col z-10">
                                                        <span className="font-bold text-white text-lg tracking-tight shadow-black drop-shadow-md">
                                                            {user.username}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={cn(
                                                                "flex h-2 w-2 rounded-full",
                                                                speakingUsers[user.userId] ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-zinc-500"
                                                            )} />
                                                            <span className="text-xs font-medium text-zinc-300">
                                                                {speakingUsers[user.userId] ? "Speaking" : "Connected"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Controls Body */}
                                                <div className="p-5 space-y-5 bg-gradient-to-b from-zinc-900/50 to-zinc-950/80">
                                                    {/* Badges Row */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.isMuted && (
                                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-300 rounded-md text-xs font-medium border border-red-500/20 shadow-sm">
                                                                <MicOff className="w-3.5 h-3.5" />
                                                                <span>Muted</span>
                                                            </div>
                                                        )}
                                                        {user.isDeafened && (
                                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-md text-xs font-medium border border-white/5 shadow-sm">
                                                                <HeadphoneOff className="w-3.5 h-3.5" />
                                                                <span>Deafened</span>
                                                            </div>
                                                        )}
                                                        {user.isCameraOn && (
                                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-md text-xs font-medium border border-indigo-500/20 shadow-sm">
                                                                <Video className="w-3.5 h-3.5" />
                                                                <span>Camera On</span>
                                                            </div>
                                                        )}
                                                        {!user.isMuted && !user.isDeafened && !user.isCameraOn && (
                                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/5 text-emerald-300 rounded-md text-xs font-medium border border-emerald-500/10 shadow-sm">
                                                                <Mic className="w-3.5 h-3.5" />
                                                                <span>Listening</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Volume Control */}
                                                    <div className="space-y-3 pt-2">
                                                        <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                                                            <span className="flex items-center gap-2">
                                                                <Volume2 className="w-4 h-4 text-zinc-300" />
                                                                User Volume
                                                            </span>
                                                            <span className="text-indigo-400 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                                                {userVolumes?.[user.userId] ?? 50}%
                                                            </span>
                                                        </div>

                                                        {/* Custom Slider Container to ensure visibility */}
                                                        <div className="px-1 py-1">
                                                            <SliderPrimitive.Root
                                                                defaultValue={[50]}
                                                                max={100}
                                                                step={1}
                                                                value={[userVolumes?.[user.userId] ?? 50]}
                                                                onValueChange={(vals) => setUserVolume?.(user.userId, vals[0])}
                                                                className="relative flex w-full touch-none select-none items-center py-2 cursor-pointer"
                                                            >
                                                                <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-zinc-700/50">
                                                                    <SliderPrimitive.Range className="absolute h-full bg-indigo-500" />
                                                                </SliderPrimitive.Track>
                                                                <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-indigo-500 bg-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg shadow-indigo-500/50" />
                                                            </SliderPrimitive.Root>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
