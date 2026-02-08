// Local type definitions - matches Prisma schema

export type MemberRole = "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";

export type ChannelType = "TEXT" | "VOICE";

export type UserStatus = "ONLINE" | "IDLE" | "DND" | "OFFLINE";

export interface User {
    id: string;
    username: string;
    email: string | null;
    password: string;
    avatar: string | null;
    status?: UserStatus;
    lastSeen?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Server {
    id: string;
    name: string;
    icon: string | null;
    inviteCode: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Member {
    id: string;
    role: MemberRole;
    nickname?: string | null;
    userId: string;
    serverId: string;
    joinedAt: Date;
}

export interface Channel {
    id: string;
    name: string;
    type: ChannelType;
    topic?: string | null;
    serverId: string;
    position: number;
    createdAt: Date;
}

export interface Message {
    id: string;
    content: string;
    fileUrl: string | null;
    deleted: boolean;
    edited?: boolean;
    channelId: string;
    userId: string;
    replyToId?: string | null;
    replyToUserId?: string | null;
    mentions?: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Reaction {
    id: string;
    emoji: string;
    userId: string;
    messageId: string;
    createdAt: Date;
}

export interface Invite {
    id: string;
    code: string;
    uses: number;
    maxUses: number | null;
    expiresAt: Date | null;
    serverId: string;
    creatorId: string;
    createdAt: Date;
}

export interface ReadState {
    id: string;
    userId: string;
    channelId: string;
    lastMessageId: string | null;
    lastReadAt: Date;
}

export type SafeUser = Omit<User, "password">;

export interface ServerWithMembers extends Server {
    members: (Member & {
        user: SafeUser;
    })[];
    channels: Channel[];
    _count?: {
        members: number;
    };
}

export interface ChannelWithMessages extends Channel {
    messages: MessageWithUser[];
}

export interface MessageWithUser extends Message {
    user: SafeUser;
    replyTo?: MessageWithUser | null;
    reactions?: ReactionGroup[];
}

export interface ReactionGroup {
    emoji: string;
    count: number;
    reacted: boolean;
}

export interface MemberWithUser extends Member {
    user: SafeUser;
}

export interface InviteWithDetails extends Invite {
    server: {
        id: string;
        name: string;
        icon: string | null;
        _count?: { members: number };
    };
    creator: SafeUser;
}

export interface SocketMessage {
    id: string;
    content: string;
    channelId: string;
    userId: string;
    user: SafeUser;
    createdAt: string;
    updatedAt: string;
}

export interface TypingUser {
    id: string;
    username: string;
}

// Socket.io event types
export interface PresenceUpdate {
    userId: string;
    status: UserStatus;
}

export interface UnreadUpdate {
    channelId: string;
    count: number;
}

