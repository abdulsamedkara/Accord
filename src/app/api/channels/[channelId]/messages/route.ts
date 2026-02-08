import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const MESSAGES_BATCH = 50;

// GET - Get messages in channel
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
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get("cursor");

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

        const messages = await db.message.findMany({
            take: MESSAGES_BATCH,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),
            where: { channelId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        let nextCursor: string | null = null;
        if (messages.length === MESSAGES_BATCH) {
            nextCursor = messages[MESSAGES_BATCH - 1].id;
        }

        return NextResponse.json({
            messages: messages.reverse(),
            nextCursor,
        });
    } catch (error) {
        console.error("Get messages error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Send message
export async function POST(
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
        const { content, fileUrl } = body;

        if (!content && !fileUrl) {
            return NextResponse.json(
                { error: "Message content is required" },
                { status: 400 }
            );
        }

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

        const message = await db.message.create({
            data: {
                content: content || "",
                fileUrl,
                channelId,
                userId: user.id,
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

        return NextResponse.json({ message }, { status: 201 });
    } catch (error) {
        console.error("Send message error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
