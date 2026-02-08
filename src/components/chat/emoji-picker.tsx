"use client";

import { useState } from "react";
import { Smile, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Common emoji set for reactions
const EMOJI_LIST = [
    "👍", "👎", "😂", "❤️", "🎉", "😮", "😢", "😡",
    "🔥", "💯", "✅", "❌", "⭐", "🚀", "👀", "🙏",
];

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
    return (
        <div className="absolute bottom-full mb-2 p-2 bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] shadow-xl z-50">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[hsl(var(--border))]">
                <span className="text-sm font-medium">Reactions</span>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-[hsl(var(--accent))] rounded transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-8 gap-1">
                {EMOJI_LIST.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => {
                            onSelect(emoji);
                            onClose();
                        }}
                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-[hsl(var(--accent))] rounded transition-colors"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Reaction display component for messages
interface Reaction {
    emoji: string;
    count: number;
    reacted: boolean;
}

interface ReactionsDisplayProps {
    reactions: Reaction[];
    onToggle: (emoji: string) => void;
}

export function ReactionsDisplay({ reactions, onToggle }: ReactionsDisplayProps) {
    if (reactions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {reactions.map((reaction) => (
                <button
                    key={reaction.emoji}
                    onClick={() => onToggle(reaction.emoji)}
                    className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-sm transition-colors",
                        reaction.reacted
                            ? "bg-[hsl(var(--primary))]/20 border border-[hsl(var(--primary))]/50"
                            : "bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/80"
                    )}
                >
                    <span>{reaction.emoji}</span>
                    <span className="text-xs">{reaction.count}</span>
                </button>
            ))}
        </div>
    );
}

interface AddReactionButtonProps {
    onSelect: (emoji: string) => void;
}

export function AddReactionButton({ onSelect }: AddReactionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 hover:bg-[hsl(var(--accent))] rounded transition-colors"
                title="Add Reaction"
            >
                <Smile className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            </button>

            {isOpen && (
                <EmojiPicker
                    onSelect={(emoji) => {
                        onSelect(emoji);
                        setIsOpen(false);
                    }}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
