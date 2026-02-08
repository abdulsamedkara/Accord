"use client";

import { useRef, useEffect, useState } from "react";
import { formatDate, getAvatarUrl } from "@/lib/utils";
import { MessageWithUser } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageListProps {
    messages: MessageWithUser[];
    currentUserId: string;
    onEditMessage: (messageId: string, content: string) => void;
    onDeleteMessage: (messageId: string) => void;
}

export function MessageList({
    messages,
    currentUserId,
    onEditMessage,
    onDeleteMessage,
}: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Group messages by user and time, filter out invalid messages
    const groupedMessages = messages
        .filter(message => message && message.id) // Filter out messages without id
        .reduce((groups, message, index) => {
            const prevMessage = messages[index - 1];
            const showHeader =
                !prevMessage ||
                prevMessage.userId !== message.userId ||
                new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 5 * 60 * 1000;

            groups.push({ ...message, showHeader });
            return groups;
        }, [] as (MessageWithUser & { showHeader: boolean })[]);

    return (
        <ScrollArea className="flex-1 px-4">
            <div className="py-4 space-y-0.5">
                {groupedMessages.map((message, index) => (
                    <MessageItem
                        key={message.id || `msg-${index}`}
                        message={message}
                        showHeader={message.showHeader}
                        isOwner={message.userId === currentUserId}
                        onEdit={(content) => onEditMessage(message.id, content)}
                        onDelete={() => onDeleteMessage(message.id)}
                    />
                ))}
                <div ref={bottomRef} />
            </div>
        </ScrollArea>
    );
}

interface MessageItemProps {
    message: MessageWithUser;
    showHeader: boolean;
    isOwner: boolean;
    onEdit: (content: string) => void;
    onDelete: () => void;
}

function MessageItem({
    message,
    showHeader,
    isOwner,
    onEdit,
    onDelete,
}: MessageItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [showActions, setShowActions] = useState(false);

    const handleSaveEdit = () => {
        if (editContent.trim() && editContent !== message.content) {
            onEdit(editContent);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit();
        }
        if (e.key === "Escape") {
            setIsEditing(false);
            setEditContent(message.content);
        }
    };

    return (
        <div
            className={cn(
                "group relative flex gap-4 px-4 py-0.5 hover:bg-black/5 transition-colors",
                showHeader && "mt-4 pt-1"
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {showHeader ? (
                <Avatar className="w-10 h-10 mt-0.5">
                    <AvatarImage src={getAvatarUrl(message.user.avatar, message.user.username)} />
                    <AvatarFallback>{message.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
            ) : (
                <div className="w-10 flex-shrink-0" />
            )}

            <div className="flex-1 min-w-0">
                {showHeader && (
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-medium text-white hover:underline cursor-pointer">
                            {message.user.username}
                        </span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {formatDate(new Date(message.createdAt))}
                        </span>
                    </div>
                )}

                {isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full p-2 bg-[hsl(var(--input))] rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                            rows={1}
                            autoFocus
                        />
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                            escape to{" "}
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-[hsl(var(--primary))] hover:underline"
                            >
                                cancel
                            </button>{" "}
                            • enter to{" "}
                            <button
                                onClick={handleSaveEdit}
                                className="text-[hsl(var(--primary))] hover:underline"
                            >
                                save
                            </button>
                        </div>
                    </div>
                ) : (
                    <p
                        className={cn(
                            "text-[hsl(var(--foreground))] break-words whitespace-pre-wrap",
                            message.deleted && "italic text-[hsl(var(--muted-foreground))]"
                        )}
                    >
                        {message.content}
                        {message.updatedAt !== message.createdAt && !message.deleted && (
                            <span className="text-xs text-[hsl(var(--muted-foreground))] ml-1">(edited)</span>
                        )}
                    </p>
                )}
            </div>

            {/* Action buttons */}
            {showActions && !message.deleted && !isEditing && (
                <div className="absolute right-4 -top-3 flex items-center gap-0.5 p-0.5 bg-[hsl(var(--card))] rounded-md border border-[hsl(var(--border))] shadow-lg">
                    {isOwner && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 hover:bg-[hsl(var(--accent))] rounded transition-colors"
                            title="Edit"
                        >
                            <Edit2 className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        </button>
                    )}
                    {isOwner && (
                        <button
                            onClick={onDelete}
                            className="p-1.5 hover:bg-[hsl(var(--accent))] rounded transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
