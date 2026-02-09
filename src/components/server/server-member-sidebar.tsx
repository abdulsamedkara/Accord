"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
import { ShieldAlert, ShieldCheck, Crown } from "lucide-react";
import { useAppStore } from "@/store";
import { MemberWithUser } from "@/types";
import { cn } from "@/lib/utils";

interface ServerMemberSidebarProps {
    members: MemberWithUser[];
}

const roleIconMap = {
    "MEMBER": null,
    "MODERATOR": <ShieldCheck className="h-4 w-4 ml-1.5 text-indigo-400" />,
    "ADMIN": <ShieldAlert className="h-4 w-4 ml-1.5 text-rose-500" />,
    "OWNER": <Crown className="h-4 w-4 ml-1.5 text-amber-500" />
}

export const ServerMemberSidebar = ({
    members
}: ServerMemberSidebarProps) => {
    const { onlineUsers } = useAppStore();

    const onlineMembers = members.filter((member) => onlineUsers.has(member.userId));
    const offlineMembers = members.filter((member) => !onlineUsers.has(member.userId));

    return (
        <aside className="w-60 bg-[#2B2D31]/95 backdrop-blur-sm hidden md:flex flex-col border-l border-[#1F2023] h-full">
            <ScrollArea className="flex-1 px-3">
                <div className="mt-4 mb-8">
                    <h3 className="text-xs font-bold text-[#949BA4] uppercase mb-3 px-2 flex items-center justify-between">
                        <span>Online</span>
                        <span className="bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded text-[10px]">{onlineMembers.length}</span>
                    </h3>
                    <div className="space-y-[2px]">
                        {onlineMembers.map((member) => (
                            <MemberItem key={member.id} member={member} isOnline={true} />
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-xs font-bold text-[#949BA4] uppercase mb-3 px-2 flex items-center justify-between">
                        <span>Offline</span>
                        <span className="bg-zinc-500/10 text-zinc-500 px-1.5 py-0.5 rounded text-[10px]">{offlineMembers.length}</span>
                    </h3>
                    <div className="space-y-[2px]">
                        {offlineMembers.map((member) => (
                            <MemberItem key={member.id} member={member} isOnline={false} />
                        ))}
                    </div>
                </div>
            </ScrollArea>
        </aside>
    );
}

function MemberItem({ member, isOnline }: { member: MemberWithUser; isOnline: boolean }) {
    return (
        <div className={cn(
            "group flex items-center gap-x-3 w-full p-2 rounded-md transition-all duration-200 cursor-pointer select-none",
            "hover:bg-zinc-700/50 hover:shadow-sm active:scale-[0.98]",
            !isOnline && "opacity-60 hover:opacity-100"
        )}>
            <div className="relative">
                <UserAvatar
                    src={member.user.avatar}
                    name={member.user.username}
                    className="h-9 w-9 md:h-9 md:w-9 border-2 border-transparent group-hover:border-zinc-500/30 transition-colors"
                />
                {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#2B2D31] rounded-full flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-[#2B2D31]" />
                    </div>
                )}
            </div>

            <div className="flex flex-col min-w-0">
                <div className="text-sm font-medium flex items-center text-zinc-300 group-hover:text-zinc-100 transition-colors truncate">
                    <span className="truncate">{member.user.username}</span>
                    {roleIconMap[member.role] as React.ReactNode}
                </div>
                {member.role !== "MEMBER" && (
                    <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400 capitalize truncate">
                        {member.role.toLowerCase()}
                    </p>
                )}
            </div>
        </div>
    )
}
