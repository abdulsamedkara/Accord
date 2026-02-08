"use client";

import { useState, useRef, useEffect } from "react";
import { PlusCircle, Smile, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    channelName: string;
    onSendMessage: (content: string) => void;
    onTypingStart: () => void;
    onTypingStop: () => void;
    disabled?: boolean;
}

export function ChatInput({
    channelName,
    onSendMessage,
    onTypingStart,
    onTypingStop,
    disabled = false,
}: ChatInputProps) {
    const [content, setContent] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);

        // Handle typing indicator
        if (!isTyping) {
            setIsTyping(true);
            onTypingStart();
        }

        // Reset typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            onTypingStop();
        }, 2000);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!content.trim() || disabled) return;

        onSendMessage(content.trim());
        setContent("");

        // Stop typing indicator
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        setIsTyping(false);
        onTypingStop();

        // Refocus input
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
        }
    }, [content]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return (
        <form onSubmit={handleSubmit} className="px-4 pb-6 pt-2">
            <div className="flex items-end gap-2 bg-[hsl(var(--input))] rounded-lg px-4 py-2">
                <button
                    type="button"
                    className="flex-shrink-0 p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                    <PlusCircle className="w-6 h-6" />
                </button>

                <textarea
                    ref={inputRef}
                    value={content}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message #${channelName}`}
                    className={cn(
                        "flex-1 bg-transparent resize-none focus:outline-none text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]",
                        "max-h-[200px] min-h-[24px]"
                    )}
                    rows={1}
                    disabled={disabled}
                />

                <button
                    type="button"
                    className="flex-shrink-0 p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                    <Smile className="w-6 h-6" />
                </button>

                {content.trim() && (
                    <button
                        type="submit"
                        className="flex-shrink-0 p-1 text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors"
                        disabled={disabled}
                    >
                        <Send className="w-6 h-6" />
                    </button>
                )}
            </div>
        </form>
    );
}
