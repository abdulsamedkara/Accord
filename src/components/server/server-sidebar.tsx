"use client";

import { Plus } from "lucide-react";
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
    return (
        <div className="flex flex-col items-center w-[72px] h-full py-3 bg-[hsl(var(--sidebar-bg))]">
            <TooltipProvider delayDuration={0}>
                {/* Home / DM button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className={cn(
                                "server-icon mb-2",
                                !currentServerId && "active"
                            )}
                            onClick={() => onServerClick("")}
                        >
                            <svg
                                width="28"
                                height="20"
                                viewBox="0 0 28 20"
                                fill="none"
                                className="text-white"
                            >
                                <path
                                    fill="currentColor"
                                    d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1582 0.934541 16.9329 1.4184C14.9675 1.11629 12.9705 1.11629 11.0051 1.4184C10.7798 0.934541 10.5277 0.461742 10.2794 0C8.42586 0.318797 6.61903 0.879656 4.90854 1.67671C1.65976 6.43959 0.686813 11.0945 1.17347 15.6801C2.89802 17.0131 4.84866 18.0416 6.93871 18.7101C7.38757 18.108 7.79219 17.4733 8.14853 16.8112C7.49798 16.5637 6.87057 16.2637 6.27104 15.9143C6.43596 15.7981 6.59649 15.6794 6.75264 15.5582C10.7186 17.4056 15.081 17.4056 19.0015 15.5582C19.1558 15.6794 19.3182 15.7981 19.4831 15.9143C18.8798 16.2637 18.2524 16.5637 17.6056 16.8112C17.962 17.4733 18.3666 18.108 18.8155 18.7101C20.9055 18.0416 22.8562 17.0131 24.5807 15.6801C25.1526 10.4068 23.7696 5.80056 23.0212 1.67671Z"
                                />
                            </svg>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Direct Messages</TooltipContent>
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
            </TooltipProvider>
        </div>
    );
}
