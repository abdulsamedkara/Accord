"use client";

import { useState } from "react";
import { Hash, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ChannelType } from "@/types";
import { cn } from "@/lib/utils";

interface CreateChannelModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    serverId: string;
    onSuccess: () => void;
}

export function CreateChannelModal({
    open,
    onOpenChange,
    serverId,
    onSuccess,
}: CreateChannelModalProps) {
    const [name, setName] = useState("");
    const [type, setType] = useState<ChannelType>("TEXT");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch(`/api/servers/${serverId}/channels`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, type }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create channel");
            }

            onOpenChange(false);
            setName("");
            setType("TEXT");
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create channel");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[hsl(var(--card))] border-none max-w-md">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold">
                        Create Channel
                    </DialogTitle>
                    <DialogDescription className="text-center text-[hsl(var(--muted-foreground))]">
                        Create a new text or voice channel
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6">
                    {error && (
                        <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    {/* Channel Type */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-[hsl(var(--muted-foreground))]">
                            Channel Type
                        </label>
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setType("TEXT")}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-md border transition-colors",
                                    type === "TEXT"
                                        ? "bg-[hsl(var(--muted))] border-[hsl(var(--primary))]"
                                        : "bg-[hsl(var(--input))] border-transparent hover:bg-[hsl(var(--accent))]"
                                )}
                            >
                                <Hash className="w-6 h-6" />
                                <div className="text-left">
                                    <div className="font-medium">Text</div>
                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                        Send messages, images, and GIFs
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setType("VOICE")}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-md border transition-colors",
                                    type === "VOICE"
                                        ? "bg-[hsl(var(--muted))] border-[hsl(var(--primary))]"
                                        : "bg-[hsl(var(--input))] border-transparent hover:bg-[hsl(var(--accent))]"
                                )}
                            >
                                <Volume2 className="w-6 h-6" />
                                <div className="text-left">
                                    <div className="font-medium">Voice</div>
                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                        Hang out together with voice and video
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Channel Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-[hsl(var(--muted-foreground))]">
                            Channel Name
                        </label>
                        <div className="flex items-center bg-[hsl(var(--input))] rounded-md">
                            {type === "TEXT" ? (
                                <Hash className="w-5 h-5 ml-3 text-[hsl(var(--muted-foreground))]" />
                            ) : (
                                <Volume2 className="w-5 h-5 ml-3 text-[hsl(var(--muted-foreground))]" />
                            )}
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                                className="bg-transparent border-none focus-visible:ring-0"
                                placeholder="new-channel"
                                required
                                minLength={1}
                                maxLength={100}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="discord"
                            disabled={isLoading || !name.trim()}
                        >
                            {isLoading ? "Creating..." : "Create Channel"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
