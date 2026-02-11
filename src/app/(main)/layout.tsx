"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/store";
import { getSocket } from "@/realtime/socket";
import { ServerSidebar } from "@/components/server/server-sidebar";
import { CreateServerModal } from "@/components/server/create-server-modal";
import { JoinServerModal } from "@/components/server/join-server-modal";
import { ActiveVoiceManager } from "@/components/voice/active-voice-manager";
import { UserSettingsModal } from "@/components/user/user-settings-modal";
import { SafeUser, ServerWithMembers } from "@/types";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const {
        user,
        setUser,
        servers,
        setServers,
        currentServerId,
        setCurrentServer,
        isCreateServerModalOpen,
        setCreateServerModalOpen,
        updateVoiceState,
        setOnlineUsers,
        addOnlineUser,
        removeOnlineUser,
    } = useAppStore();
    const [isLoading, setIsLoading] = useState(true);

    // Extract current server ID from URL
    useEffect(() => {
        const match = pathname.match(/\/servers\/([^\/]+)/);
        if (match) {
            setCurrentServer(match[1]);
        } else {
            setCurrentServer(null);
        }
    }, [pathname, setCurrentServer]);

    // Fetch user and servers on mount
    useEffect(() => {
        console.log("[MainLayout] Mounting, starting fetch...");
        const fetchData = async () => {
            try {
                // Fetch current user
                console.log("[MainLayout] Fetching user...");
                const userRes = await fetch("/api/auth/me");
                const userData = await userRes.json();
                console.log("[MainLayout] User data:", userData);

                if (!userData.user) {
                    console.log("[MainLayout] No user found, redirecting...");
                    router.push("/login");
                    return;
                }

                setUser(userData.user);

                // Fetch servers
                console.log("[MainLayout] Fetching servers...");
                const serversRes = await fetch("/api/servers");
                const serversData = await serversRes.json();
                console.log("[MainLayout] Servers data:", serversData);
                setServers(serversData.servers || []);
            } catch (error) {
                console.error("[MainLayout] Failed to fetch data:", error);
                // router.push("/login");
            } finally {
                console.log("[MainLayout] Fetch complete, setting isLoading to false");
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router, setUser, setServers]);

    // Listen for global socket events (Voice & Presence)
    useEffect(() => {
        if (!user) {
            console.log("[MainLayout] No user for socket yet");
            return;
        }

        console.log("[MainLayout] Initializing socket for user:", user.id);
        const socketInstance = getSocket(user.id);

        const handleVoiceStateUpdate = (data: { channelId: string; users: any[] }) => {
            // console.log("[MainLayout] Received voice update:", data);
            updateVoiceState(data.channelId, data.users);
        };

        const handlePresenceState = (data: { onlineUsers: string[] }) => {
            console.log("[MainLayout] Received presence state:", data.onlineUsers.length);
            setOnlineUsers(data.onlineUsers);
        };

        const handlePresenceUpdate = (data: { userId: string; isOnline: boolean }) => {
            console.log("[MainLayout] Presence update:", data);
            if (data.isOnline) {
                addOnlineUser(data.userId);
            } else {
                removeOnlineUser(data.userId);
            }
        };

        socketInstance.on("voice:state-update", handleVoiceStateUpdate);
        socketInstance.on("presence:state", handlePresenceState);
        socketInstance.on("presence:update", handlePresenceUpdate);

        return () => {
            socketInstance.off("voice:state-update", handleVoiceStateUpdate);
            socketInstance.off("presence:state", handlePresenceState);
            socketInstance.off("presence:update", handlePresenceUpdate);
        };
    }, [user, updateVoiceState, setOnlineUsers, addOnlineUser, removeOnlineUser]);

    const handleServerClick = (serverId: string) => {
        if (!serverId) {
            router.push("/");
            return;
        }

        const server = servers.find((s) => s.id === serverId);
        if (server) {
            const firstTextChannel = server.channels.find((c) => c.type === "TEXT");
            if (firstTextChannel) {
                router.push(`/servers/${serverId}/channels/${firstTextChannel.id}`);
            } else {
                router.push(`/servers/${serverId}`);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[hsl(var(--background))]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[hsl(var(--muted-foreground))]">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex overflow-hidden">
            <ServerSidebar
                servers={servers}
                currentServerId={currentServerId}
                onServerClick={handleServerClick}
                onCreateServer={() => setCreateServerModalOpen(true)}
            />

            <main className="flex-1 flex overflow-hidden">
                {children}
            </main>

            <CreateServerModal
                open={isCreateServerModalOpen}
                onOpenChange={setCreateServerModalOpen}
            />
            <JoinServerModal />
            <UserSettingsModal />
            <ActiveVoiceManager />
        </div>
    );
}
