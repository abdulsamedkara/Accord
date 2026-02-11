"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JoinServerModal() {
    const { isJoinServerModalOpen, setJoinServerModalOpen, addServer } = useAppStore();
    const router = useRouter();
    const [inviteCode, setInviteCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleClose = () => {
        setJoinServerModalOpen(false);
        setInviteCode("");
        setError("");
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/servers/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Join failed");
            }

            const data = await res.json();

            // Refresh servers to show the new one immediately
            // Ideally we'd just add it to store, but we need full server object
            router.refresh();

            // Force a reload or redirect
            window.location.href = `/servers/${data.serverId}`;

            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to join server");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isJoinServerModalOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#313338] text-white border-none p-0 overflow-hidden">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold">Bir Sunucuya Katıl</DialogTitle>
                    <DialogDescription className="text-center text-zinc-400">
                        Aşağıya davet kodunu girerek bir sunucuya katılabilirsin.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleJoin} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="uppercase text-xs font-bold text-zinc-400">
                            Davet Kodu <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            disabled={isLoading}
                            className="bg-[#1e1f22] border-0 focus-visible:ring-0 text-white focus-visible:ring-offset-0"
                            placeholder="Örn: 7G2s9X (veya tam link)"
                            value={inviteCode}
                            onChange={(e) => {
                                // Extract code from link if pasted
                                let val = e.target.value;
                                if (val.includes("/invite/")) {
                                    val = val.split("/invite/")[1];
                                }
                                setInviteCode(val);
                            }}
                        />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>

                    <DialogFooter className="bg-[#2b2d31] px-6 py-4 -mx-6 -mb-6 mt-8 flex justify-between items-center">
                        <Button variant="ghost" type="button" onClick={handleClose} disabled={isLoading}>
                            Vazgeç
                        </Button>
                        <Button disabled={isLoading || inviteCode.length < 1} className="bg-[#5865F2] hover:bg-[#4752c4] text-white">
                            Sunucuya Katıl
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
