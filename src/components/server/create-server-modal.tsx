"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/store";

interface CreateServerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateServerModal({ open, onOpenChange }: CreateServerModalProps) {
    const router = useRouter();
    const { addServer } = useAppStore();
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/servers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create server");
            }

            addServer(data.server);
            onOpenChange(false);
            setName("");
            router.push(`/servers/${data.server.id}/channels/${data.server.channels[0]?.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create server");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[hsl(var(--card))] border-none max-w-md">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold">
                        Customize your server
                    </DialogTitle>
                    <DialogDescription className="text-center text-[hsl(var(--muted-foreground))]">
                        Give your new server a personality with a name. You can always change it later.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-8 px-6 pb-6">
                    {error && (
                        <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-[hsl(var(--muted-foreground))]">
                            Server Name
                        </label>
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-[hsl(var(--input))] border-none"
                            placeholder="My Awesome Server"
                            required
                            minLength={2}
                            maxLength={100}
                        />
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            variant="discord"
                            disabled={isLoading || !name.trim()}
                        >
                            {isLoading ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
