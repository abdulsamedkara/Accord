import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateInviteCode } from "@/lib/utils";

// GET - Get server details
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

        const server = await db.server.findUnique({
            where: {
                id: serverId,
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
            },
        });

        if (!server) {
            return NextResponse.json({ error: "Server not found" }, { status: 404 });
        }

        return NextResponse.json({ server });
    } catch (error) {
        console.error("Get server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH - Update server
export async function PATCH(
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
        const { name, icon } = body;

        // Check if user is owner or admin
        const member = await db.member.findUnique({
            where: {
                userId_serverId: {
                    userId: user.id,
                    serverId,
                },
            },
        });

        if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const server = await db.server.update({
            where: { id: serverId },
            data: {
                ...(name && { name }),
                ...(icon !== undefined && { icon }),
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

        return NextResponse.json({ server });
    } catch (error) {
        console.error("Update server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete server (owner only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ serverId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { serverId } = await params;

        const server = await db.server.findUnique({
            where: {
                id: serverId,
                ownerId: user.id,
            },
        });

        if (!server) {
            return NextResponse.json(
                { error: "Server not found or you are not the owner" },
                { status: 404 }
            );
        }

        await db.server.delete({
            where: { id: serverId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
