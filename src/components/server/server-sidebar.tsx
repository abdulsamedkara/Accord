"use client";

import { Plus, Settings, Bot } from "lucide-react";
import { useAppStore } from "@/store";
import { ServerWithMembers } from "@/types";
import { cn, getAvatarUrl } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ServerSidebarProps {
    servers: ServerWithMembers[];
    currentServerId: string | null;
    onServerClick: (serverId: string) => void;
    onCreateServer: () => void;
}

export function ServerSidebar({
    servers,
    currentServerId,
    onServerClick,
    onCreateServer,
}: ServerSidebarProps) {
    const { setUserSettingsModalOpen } = useAppStore();

    return (
        <div className="flex flex-col items-center w-[72px] h-full py-3 bg-[hsl(var(--sidebar-bg))]">
            <TooltipProvider delayDuration={0}>
                {/* Home / DM button (Disabled) */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className={cn(
                                "server-icon mb-2 cursor-not-allowed opacity-75",
                                !currentServerId && "active"
                            )}
                        /* onClick={() => onServerClick("")} */
                        >
                            <Bot className="w-7 h-7 text-white" /> {/* Placeholder for App Icon */}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Direct Messages (Coming Soon)</TooltipContent>
                </Tooltip>

                <Separator className="w-8 h-0.5 bg-[hsl(var(--border))] rounded-full mb-2" />

                {/* Server list */}
                <ScrollArea className="flex-1 w-full">
                    <div className="flex flex-col items-center gap-2">
                        {servers.map((server) => (
                            <Tooltip key={server.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        className={cn(
                                            "server-icon relative group",
                                            currentServerId === server.id && "active"
                                        )}
                                        onClick={() => onServerClick(server.id)}
                                    >
                                        {server.icon ? (
                                            <img
                                                src={server.icon}
                                                alt={server.name}
                                                className="w-full h-full object-cover rounded-[inherit]"
                                            />
                                        ) : (
                                            <span className="text-lg font-semibold">
                                                {server.name.slice(0, 2).toUpperCase()}
                                            </span>
                                        )}
                                        {/* Active indicator */}
                                        <div
                                            className={cn(
                                                "absolute left-0 top-1/2 -translate-x-[10px] -translate-y-1/2 w-1 rounded-r-full bg-white transition-all",
                                                currentServerId === server.id
                                                    ? "h-10"
                                                    : "h-0 group-hover:h-5"
                                            )}
                                        />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right">{server.name}</TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </ScrollArea>

                <Separator className="w-8 h-0.5 bg-[hsl(var(--border))] rounded-full my-2" />

                {/* Add server button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="server-icon text-green-500 hover:text-white hover:bg-green-500"
                            onClick={onCreateServer}
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Add a Server</TooltipContent>
                </Tooltip>

                <Separator className="w-8 h-0.5 bg-[hsl(var(--border))] rounded-full my-2" />

                {/* Settings button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="server-icon text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                            onClick={() => setUserSettingsModalOpen(true)}
                        >
                            <Settings className="w-6 h-6" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">User Settings</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
