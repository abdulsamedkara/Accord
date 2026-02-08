import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - List channels in server
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

        // Verify user is member
        const member = await db.member.findUnique({
            where: {
                userId_serverId: {
                    userId: user.id,
                    serverId,
                },
            },
        });

        if (!member) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const channels = await db.channel.findMany({
            where: { serverId },
            orderBy: { position: "asc" },
        });

        return NextResponse.json({ channels });
    } catch (error) {
        console.error("Get channels error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create channel
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
        const { name, type = "TEXT" } = body;

        if (!name || name.length < 1 || name.length > 100) {
            return NextResponse.json(
                { error: "Channel name must be between 1 and 100 characters" },
                { status: 400 }
            );
        }

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

        // Get max position
        const maxPosition = await db.channel.findFirst({
            where: { serverId },
            orderBy: { position: "desc" },
            select: { position: true },
        });

        const channel = await db.channel.create({
            data: {
                name: name.toLowerCase().replace(/\s+/g, "-"),
                type,
                serverId,
                position: (maxPosition?.position ?? -1) + 1,
            },
        });

        return NextResponse.json({ channel }, { status: 201 });
    } catch (error) {
        console.error("Create channel error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
