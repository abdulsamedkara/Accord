"use client";

import { Hash, Users } from "lucide-react";
import { Channel } from "@/types";

interface ChatHeaderProps {
    channel: Channel;
    memberCount?: number;
}

export function ChatHeader({ channel, memberCount }: ChatHeaderProps) {
    return (
        <div className="h-12 px-4 flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--chat-bg))]">
            <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                <span className="font-semibold">{channel.name}</span>
            </div>

            <div className="flex items-center gap-4">
                {memberCount !== undefined && (
                    <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{memberCount}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
