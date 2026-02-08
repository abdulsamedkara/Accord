"use client";

import { useState } from "react";
import { Copy, Check, Link, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface InviteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    serverId: string;
    serverName: string;
}

interface Invite {
    id: string;
    code: string;
    uses: number;
    maxUses: number | null;
    expiresAt: string | null;
}

export function InviteModal({
    open,
    onOpenChange,
    serverId,
    serverName,
}: InviteModalProps) {
    const [invite, setInvite] = useState<Invite | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [maxUses, setMaxUses] = useState<string>("");
    const [expiresIn, setExpiresIn] = useState<string>("24");

    const inviteLink = invite
        ? `${window.location.origin}/invite/${invite.code}`
        : "";

    const generateInvite = async () => {
        setIsLoading(true);
        try {
            const body: { maxUses?: number; expiresIn?: number } = {};

            if (maxUses && parseInt(maxUses) > 0) {
                body.maxUses = parseInt(maxUses);
            }
            if (expiresIn && parseInt(expiresIn) > 0) {
                body.expiresIn = parseInt(expiresIn);
            }

            const res = await fetch(`/api/servers/${serverId}/invites`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (data.invite) {
                setInvite(data.invite);
            }
        } catch (error) {
            console.error("Failed to generate invite:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyLink = async () => {
        if (!inviteLink) return;

        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    const handleOpen = (isOpen: boolean) => {
        if (isOpen && !invite) {
            generateInvite();
        }
        if (!isOpen) {
            setInvite(null);
            setShowSettings(false);
            setMaxUses("");
            setExpiresIn("24");
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite friends to {serverName}</DialogTitle>
                    <DialogDescription>
                        Share this link with others to grant access to this server
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Invite link input */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                            <Input
                                value={isLoading ? "Generating..." : inviteLink}
                                readOnly
                                className="pl-10 pr-4 font-mono text-sm"
                            />
                        </div>
                        <Button
                            onClick={copyLink}
                            disabled={!invite || isLoading}
                            variant="discord"
                            className="px-3"
                        >
                            {copied ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </Button>
                    </div>

                    {/* Settings toggle */}
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        <span>Invite settings</span>
                    </button>

                    {/* Settings panel */}
                    {showSettings && (
                        <div className="space-y-4 p-4 bg-[hsl(var(--background))] rounded-md">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Expire after (hours)
                                </label>
                                <Input
                                    type="number"
                                    placeholder="24 (default)"
                                    value={expiresIn}
                                    onChange={(e) => setExpiresIn(e.target.value)}
                                    min="1"
                                    max="720"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Max uses (0 = unlimited)
                                </label>
                                <Input
                                    type="number"
                                    placeholder="Unlimited"
                                    value={maxUses}
                                    onChange={(e) => setMaxUses(e.target.value)}
                                    min="0"
                                    max="1000"
                                />
                            </div>

                            <Button
                                onClick={generateInvite}
                                disabled={isLoading}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                Generate New Link
                            </Button>
                        </div>
                    )}

                    {/* Invite info */}
                    {invite && (
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                            {invite.maxUses ? (
                                <span>
                                    {invite.uses}/{invite.maxUses} uses •{" "}
                                </span>
                            ) : null}
                            {invite.expiresAt ? (
                                <span>
                                    Expires{" "}
                                    {new Date(invite.expiresAt).toLocaleDateString()}
                                </span>
                            ) : (
                                <span>Never expires</span>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
