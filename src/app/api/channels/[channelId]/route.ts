import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - Get channel details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ channelId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { channelId } = await params;

        const channel = await db.channel.findUnique({
            where: { id: channelId },
            include: {
                server: {
                    include: {
                        members: {
                            where: { userId: user.id },
                        },
                    },
                },
            },
        });

        if (!channel || channel.server.members.length === 0) {
            return NextResponse.json({ error: "Channel not found" }, { status: 404 });
        }

        return NextResponse.json({ channel });
    } catch (error) {
        console.error("Get channel error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH - Update channel
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ channelId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { channelId } = await params;
        const body = await req.json();
        const { name } = body;

        const channel = await db.channel.findUnique({
            where: { id: channelId },
            include: {
                server: true,
            },
        });

        if (!channel) {
            return NextResponse.json({ error: "Channel not found" }, { status: 404 });
        }

        // Check if user is owner or admin
        const member = await db.member.findUnique({
            where: {
                userId_serverId: {
                    userId: user.id,
                    serverId: channel.serverId,
                },
            },
        });

        if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedChannel = await db.channel.update({
            where: { id: channelId },
            data: {
                ...(name && { name: name.toLowerCase().replace(/\s+/g, "-") }),
            },
        });

        return NextResponse.json({ channel: updatedChannel });
    } catch (error) {
        console.error("Update channel error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete channel
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ channelId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { channelId } = await params;

        const channel = await db.channel.findUnique({
            where: { id: channelId },
            include: {
                server: true,
            },
        });

        if (!channel) {
            return NextResponse.json({ error: "Channel not found" }, { status: 404 });
        }

        // Check if user is owner or admin
        const member = await db.member.findUnique({
            where: {
                userId_serverId: {
                    userId: user.id,
                    serverId: channel.serverId,
                },
            },
        });

        if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Don't allow deleting the last channel
        const channelCount = await db.channel.count({
            where: { serverId: channel.serverId },
        });

        if (channelCount <= 1) {
            return NextResponse.json(
                { error: "Cannot delete the last channel" },
                { status: 400 }
            );
        }

        await db.channel.delete({
            where: { id: channelId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete channel error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
