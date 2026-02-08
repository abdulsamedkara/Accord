import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { nanoid } from "nanoid";

// GET - List invites for a server
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ serverId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { serverId } = await params;

        // Check if user is a member
        const member = await db.member.findUnique({
            where: {
                userId_serverId: {
                    userId: user.id,
                    serverId,
                },
            },
        });

        if (!member) {
            return NextResponse.json({ error: "Not a member of this server" }, { status: 403 });
        }

        const invites = await db.invite.findMany({
            where: { serverId },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ invites });
    } catch (error) {
        console.error("Get invites error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a new invite
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ serverId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { serverId } = await params;
        const body = await req.json();
        const { maxUses, expiresIn } = body; // expiresIn in hours

        // Check if user is a member with invite permission
        const member = await db.member.findUnique({
            where: {
                userId_serverId: {
                    userId: user.id,
                    serverId,
                },
            },
        });

        if (!member) {
            return NextResponse.json({ error: "Not a member of this server" }, { status: 403 });
        }

        // Calculate expiry date
        let expiresAt: Date | undefined;
        if (expiresIn) {
            expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
        }

        // Generate unique invite code
        const code = nanoid(8);

        const invite = await db.invite.create({
            data: {
                code,
                maxUses: maxUses || null,
                expiresAt: expiresAt || null,
                serverId,
                creatorId: user.id,
            },
            include: {
                server: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
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

        return NextResponse.json({ invite }, { status: 201 });
    } catch (error) {
        console.error("Create invite error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
