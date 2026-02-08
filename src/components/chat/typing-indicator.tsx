"use client";

import { TypingUser } from "@/types";

interface TypingIndicatorProps {
    users: TypingUser[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
    if (users.length === 0) return null;

    const getText = () => {
        if (users.length === 1) {
            return `${users[0].username} is typing`;
        } else if (users.length === 2) {
            return `${users[0].username} and ${users[1].username} are typing`;
        } else if (users.length === 3) {
            return `${users[0].username}, ${users[1].username}, and ${users[2].username} are typing`;
        } else {
            return "Several people are typing";
        }
    };

    return (
        <div className="px-4 py-1 text-sm text-[hsl(var(--muted-foreground))]">
            <div className="flex items-center gap-2">
                <div className="flex gap-1">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                </div>
                <span>{getText()}...</span>
            </div>
        </div>
    );
}
