import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// PATCH - Edit message
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ messageId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { messageId } = await params;
        const body = await req.json();
        const { content } = body;

        if (!content) {
            return NextResponse.json(
                { error: "Message content is required" },
                { status: 400 }
            );
        }

        const message = await db.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        // Only message owner can edit
        if (message.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedMessage = await db.message.update({
            where: { id: messageId },
            data: { content },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        });

        return NextResponse.json({ message: updatedMessage });
    } catch (error) {
        console.error("Edit message error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete message
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ messageId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { messageId } = await params;

        const message = await db.message.findUnique({
            where: { id: messageId },
            include: {
                channel: {
                    include: {
                        server: true,
                    },
                },
            },
        });

        if (!message) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        // Check if user is message owner or server admin/owner
        const member = await db.member.findUnique({
            where: {
                userId_serverId: {
                    userId: user.id,
                    serverId: message.channel.serverId,
                },
            },
        });

        const canDelete =
            message.userId === user.id ||
            member?.role === "OWNER" ||
            member?.role === "ADMIN";

        if (!canDelete) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Soft delete - keep message but mark as deleted
        const updatedMessage = await db.message.update({
            where: { id: messageId },
            data: {
                deleted: true,
                content: "This message has been deleted",
                fileUrl: null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        });

        return NextResponse.json({ message: updatedMessage });
    } catch (error) {
        console.error("Delete message error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
