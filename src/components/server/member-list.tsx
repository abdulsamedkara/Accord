"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAvatarUrl, cn } from "@/lib/utils";
import { Crown, Shield, ShieldCheck } from "lucide-react";

interface Member {
    id: string;
    role: string;
    userId: string;
    user: {
        id: string;
        username: string;
        avatar: string | null;
        status?: string;
    };
}

interface MemberListProps {
    members: Member[];
    onlineUserIds?: string[];
}

export function MemberList({ members, onlineUserIds = [] }: MemberListProps) {
    // Separate members by role
    const owners = members.filter((m) => m.role === "OWNER");
    const admins = members.filter((m) => m.role === "ADMIN" || m.role === "MODERATOR");
    const regularMembers = members.filter((m) => m.role === "MEMBER");

    // Sort by online status
    const sortByOnline = (a: Member, b: Member) => {
        const aOnline = onlineUserIds.includes(a.userId);
        const bOnline = onlineUserIds.includes(b.userId);
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        return a.user.username.localeCompare(b.user.username);
    };

    const sortedOwners = [...owners].sort(sortByOnline);
    const sortedAdmins = [...admins].sort(sortByOnline);
    const sortedMembers = [...regularMembers].sort(sortByOnline);

    return (
        <div className="w-60 bg-[hsl(var(--secondary))] flex flex-col">
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-4">
                    {/* Owners */}
                    {sortedOwners.length > 0 && (
                        <MemberSection
                            title={`Owner — ${sortedOwners.length}`}
                            members={sortedOwners}
                            onlineUserIds={onlineUserIds}
                        />
                    )}

                    {/* Admins */}
                    {sortedAdmins.length > 0 && (
                        <MemberSection
                            title={`Staff — ${sortedAdmins.length}`}
                            members={sortedAdmins}
                            onlineUserIds={onlineUserIds}
                        />
                    )}

                    {/* Regular Members */}
                    {sortedMembers.length > 0 && (
                        <MemberSection
                            title={`Members — ${sortedMembers.length}`}
                            members={sortedMembers}
                            onlineUserIds={onlineUserIds}
                        />
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

interface MemberSectionProps {
    title: string;
    members: Member[];
    onlineUserIds: string[];
}

function MemberSection({ title, members, onlineUserIds }: MemberSectionProps) {
    return (
        <div>
            <h3 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">
                {title}
            </h3>
            <div className="space-y-0.5">
                {members.map((member) => (
                    <MemberItem
                        key={member.id}
                        member={member}
                        isOnline={onlineUserIds.includes(member.userId)}
                    />
                ))}
            </div>
        </div>
    );
}

interface MemberItemProps {
    member: Member;
    isOnline: boolean;
}

function MemberItem({ member, isOnline }: MemberItemProps) {
    const getRoleIcon = () => {
        switch (member.role) {
            case "OWNER":
                return <Crown className="w-3 h-3 text-yellow-400" />;
            case "ADMIN":
                return <ShieldCheck className="w-3 h-3 text-red-400" />;
            case "MODERATOR":
                return <Shield className="w-3 h-3 text-blue-400" />;
            default:
                return null;
        }
    };

    return (
        <div
            className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[hsl(var(--accent))] cursor-pointer transition-colors",
                !isOnline && "opacity-50"
            )}
        >
            {/* Avatar with status indicator */}
            <div className="relative">
                <Avatar className="w-8 h-8">
                    <AvatarImage
                        src={getAvatarUrl(member.user.avatar, member.user.username)}
                    />
                    <AvatarFallback>
                        {member.user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                {/* Online status dot */}
                <div
                    className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[hsl(var(--secondary))]",
                        isOnline ? "bg-green-500" : "bg-gray-500"
                    )}
                />
            </div>

            {/* Name and role */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                    <span className="text-sm truncate">{member.user.username}</span>
                    {getRoleIcon()}
                </div>
            </div>
        </div>
    );
}
