"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface InvitePageProps {
    params: Promise<{
        code: string;
    }>;
}

interface InviteData {
    id: string;
    code: string;
    server: {
        id: string;
        name: string;
        icon: string | null;
        _count: {
            members: number;
        };
    };
    creator: {
        id: string;
        username: string;
        avatar: string | null;
    };
}

export default function InvitePage({ params }: InvitePageProps) {
    const resolvedParams = use(params);
    const { code } = resolvedParams;
    const router = useRouter();
    const { user, setServers } = useAppStore();

    const [invite, setInvite] = useState<InviteData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [joined, setJoined] = useState(false);

    // Fetch invite details
    useEffect(() => {
        const fetchInvite = async () => {
            try {
                const res = await fetch(`/api/invite/${code}`);
                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Invalid invite");
                    return;
                }

                setInvite(data.invite);
            } catch {
                setError("Failed to load invite");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvite();
    }, [code]);

    const handleJoin = async () => {
        if (!user) {
            // Redirect to login with return URL
            router.push(`/login?redirect=/invite/${code}`);
            return;
        }

        setIsJoining(true);

        try {
            const res = await fetch(`/api/invite/${code}`, {
                method: "POST",
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to join server");
                return;
            }

            setJoined(true);

            // Refresh servers list
            const serversRes = await fetch("/api/servers");
            const serversData = await serversRes.json();
            if (serversData.servers) {
                setServers(serversData.servers);
            }

            // Navigate to server after short delay
            setTimeout(() => {
                const firstChannel = data.server?.channels?.[0];
                if (firstChannel) {
                    router.push(`/servers/${data.server.id}/channels/${firstChannel.id}`);
                } else {
                    router.push(`/servers/${data.server.id}`);
                }
            }, 1500);
        } catch {
            setError("Failed to join server");
        } finally {
            setIsJoining(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
                    <p className="text-[hsl(var(--muted-foreground))]">Loading invite...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
                <div className="max-w-md w-full bg-[hsl(var(--card))] rounded-lg p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                        <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Invalid Invite</h1>
                    <p className="text-[hsl(var(--muted-foreground))] mb-6">{error}</p>
                    <Button onClick={() => router.push("/")} variant="outline">
                        Go Home
                    </Button>
                </div>
            </div>
        );
    }

    // Success state
    if (joined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
                <div className="max-w-md w-full bg-[hsl(var(--card))] rounded-lg p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Joined Successfully!</h1>
                    <p className="text-[hsl(var(--muted-foreground))]">
                        Redirecting to {invite?.server.name}...
                    </p>
                </div>
            </div>
        );
    }

    // Invite details
    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
            <div className="max-w-md w-full bg-[hsl(var(--card))] rounded-lg p-8 text-center">
                {/* Server icon */}
                <Avatar className="w-20 h-20 mx-auto mb-4">
                    {invite?.server.icon ? (
                        <AvatarImage src={invite.server.icon} />
                    ) : (
                        <AvatarFallback className="text-2xl bg-[hsl(var(--primary))]">
                            {invite?.server.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    )}
                </Avatar>

                {/* Invite text */}
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">
                    {invite?.creator.username} invited you to join
                </p>

                {/* Server name */}
                <h1 className="text-2xl font-bold mb-4">{invite?.server.name}</h1>

                {/* Member count */}
                <div className="flex items-center justify-center gap-2 text-[hsl(var(--muted-foreground))] mb-6">
                    <Users className="w-4 h-4" />
                    <span>{invite?.server._count.members} members</span>
                </div>

                {/* Not logged in warning */}
                {!user && (
                    <div className="flex items-center gap-2 p-3 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                        <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <p className="text-sm text-yellow-500">
                            You need to log in to join this server
                        </p>
                    </div>
                )}

                {/* Join button */}
                <Button
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="w-full"
                    size="lg"
                >
                    {isJoining ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Joining...
                        </>
                    ) : user ? (
                        "Accept Invite"
                    ) : (
                        "Log in to Join"
                    )}
                </Button>
            </div>
        </div>
    );
}
