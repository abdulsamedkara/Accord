"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/store";
import { getSocket } from "@/realtime/socket";
import { ServerSidebar } from "@/components/server/server-sidebar";
import { CreateServerModal } from "@/components/server/create-server-modal";
import { ActiveVoiceManager } from "@/components/voice/active-voice-manager";
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
        const fetchData = async () => {
            try {
                // Fetch current user
                const userRes = await fetch("/api/auth/me");
                const userData = await userRes.json();

                if (!userData.user) {
                    router.push("/login");
                    return;
                }

                setUser(userData.user);

                // Fetch servers
                const serversRes = await fetch("/api/servers");
                const serversData = await serversRes.json();
                setServers(serversData.servers || []);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                router.push("/login");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router, setUser, setServers]);

    // Listen for global voice state updates
    useEffect(() => {
        const socketInstance = getSocket();

        const handleVoiceStateUpdate = (data: { channelId: string; users: any[] }) => {
            console.log("[MainLayout] Received voice update:", data);
            updateVoiceState(data.channelId, data.users);
        };

        socketInstance.on("voice:state-update", handleVoiceStateUpdate);

        return () => {
            socketInstance.off("voice:state-update", handleVoiceStateUpdate);
        };
    }, [updateVoiceState]);

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
            <ActiveVoiceManager />
        </div>
    );
}
