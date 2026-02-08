import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateInviteCode } from "@/lib/utils";

// GET - List all servers user is a member of
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const servers = await db.server.findMany({
            where: {
                members: {
                    some: {
                        userId: user.id,
                    },
                },
            },
            include: {
                channels: {
                    orderBy: {
                        position: "asc",
                    },
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return NextResponse.json({ servers });
    } catch (error) {
        console.error("Get servers error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create a new server
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, icon } = body;

        if (!name || name.length < 2 || name.length > 100) {
            return NextResponse.json(
                { error: "Server name must be between 2 and 100 characters" },
                { status: 400 }
            );
        }

        // Create server with default channel and owner membership
        const server = await db.server.create({
            data: {
                name,
                icon,
                inviteCode: generateInviteCode(),
                ownerId: user.id,
                channels: {
                    create: [
                        { name: "general", type: "TEXT", position: 0 },
                        { name: "General", type: "VOICE", position: 1 },
                    ],
                },
                members: {
                    create: {
                        userId: user.id,
                        role: "OWNER",
                    },
                },
            },
            include: {
                channels: true,
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({ server }, { status: 201 });
    } catch (error) {
        console.error("Create server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
