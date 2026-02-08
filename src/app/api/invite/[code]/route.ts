import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - Get invite details by code
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        const invite = await db.invite.findUnique({
            where: { code },
            include: {
                server: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                        _count: {
                            select: {
                                members: true,
                            },
                        },
                    },
                },
                creator: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        });

        if (!invite) {
            return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
        }

        // Check if expired
        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
            return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
        }

        // Check if max uses reached
        if (invite.maxUses && invite.uses >= invite.maxUses) {
            return NextResponse.json({ error: "Invite has reached maximum uses" }, { status: 410 });
        }

        return NextResponse.json({ invite });
    } catch (error) {
        console.error("Get invite error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Use invite to join server
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code } = await params;

        const invite = await db.invite.findUnique({
            where: { code },
            include: {
                server: true,
            },
        });

        if (!invite) {
            return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
        }

        // Check if expired
        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
            return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
        }

        // Check if max uses reached
        if (invite.maxUses && invite.uses >= invite.maxUses) {
            return NextResponse.json({ error: "Invite has reached maximum uses" }, { status: 410 });
        }

        // Check if already a member
        const existingMember = await db.member.findUnique({
            where: {
                userId_serverId: {
                    userId: user.id,
                    serverId: invite.serverId,
                },
            },
        });

        if (existingMember) {
            return NextResponse.json({
                message: "Already a member",
                server: invite.server,
            });
        }

        // Join server and increment invite uses
        const [member] = await db.$transaction([
            db.member.create({
                data: {
                    userId: user.id,
                    serverId: invite.serverId,
                    role: "MEMBER",
                },
            }),
            db.invite.update({
                where: { id: invite.id },
                data: { uses: { increment: 1 } },
            }),
        ]);

        // Get server with channels for navigation
        const server = await db.server.findUnique({
            where: { id: invite.serverId },
            include: {
                channels: {
                    orderBy: { position: "asc" },
                },
            },
        });

        return NextResponse.json({
            message: "Joined server successfully",
            server,
        });
    } catch (error) {
        console.error("Use invite error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete an invite
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code } = await params;

        const invite = await db.invite.findUnique({
            where: { code },
            include: {
                server: true,
            },
        });

        if (!invite) {
            return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        }

        // Check if user has permission (owner, admin, or invite creator)
        const member = await db.member.findUnique({
            where: {
                userId_serverId: {
                    userId: user.id,
                    serverId: invite.serverId,
                },
            },
        });

        const canDelete =
            invite.creatorId === user.id ||
            member?.role === "OWNER" ||
            member?.role === "ADMIN";

        if (!canDelete) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 });
        }

        await db.invite.delete({ where: { id: invite.id } });

        return NextResponse.json({ message: "Invite deleted" });
    } catch (error) {
        console.error("Delete invite error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
