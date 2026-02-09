import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSocket } from "@/realtime/socket";
import { getIO } from "@/lib/socket-server";

// Assuming we have a way to emit socket events from API routes. 
// If not, we might need a separate mechanism or rely on the client to get the update?
// Wait, the plan said "Socket: Emits message:update with the full message".
// In this project, `pages/api/socket/io.ts` handles the server, but Next.js App Router API routes run in a separate environment (often).
// However, earlier tasks implemented socket events. Let's see how `api/channels/[channelId]/messages` does it.
// It seems `useSocketMessages` hook sends the message via socket from CLIENT side in `ChannelPage` (lines 124-129 of page.tsx): 
// `sendSocketMessage(JSON.stringify(messageWithUser));`
// So the API route primarily persists to DB, and the CLIENT broadcasts the update?
// OR, does the socket server watch DB? No.
// Let's check `api/channels/[channelId]/messages/route.ts` if I can access it.
// Actually, looking at `ChannelPage` (step 2131), `handleSendMessage` calls API, then calls `sendSocketMessage`.
// So for reactions, I should do the same pattern:
// 1. Client calls API to toggle reaction.
// 2. API returns updated message.
// 3. Client (via hook/page) emits `message:update` socket event with the new message data.

// BUT, `Reaction` is a sub-resource.
// Let's write the API route to just handle DB Logic and return the updated message.
// The client will handle the socket broadcast.

export async function POST(
    req: Request,
    { params }: { params: Promise<{ messageId: string }> }
) {
    try {
        const user = await getCurrentUser();
        const { messageId } = await params;
        const { emoji } = await req.json();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!emoji) {
            return new NextResponse("Emoji missing", { status: 400 });
        }

        const message = await db.message.findUnique({
            where: { id: messageId },
            include: {
                channel: true // to verify specific permissions if needed, but general access is okay for now
            }
        });

        if (!message) {
            return new NextResponse("Message not found", { status: 404 });
        }

        // Check if reaction exists
        const existingReaction = await db.reaction.findUnique({
            where: {
                userId_messageId_emoji: {
                    userId: user.id,
                    messageId: messageId,
                    emoji: emoji
                }
            }
        });

        if (existingReaction) {
            // Remove reaction
            await db.reaction.delete({
                where: {
                    id: existingReaction.id
                }
            });
        } else {
            // Add reaction
            await db.reaction.create({
                data: {
                    userId: user.id,
                    messageId: messageId,
                    emoji: emoji
                }
            });
        }

        // Return the full updated message including reactions and user info
        // This is needed so the client can broadcast the full state
        const updatedMessage = await db.message.findUnique({
            where: { id: messageId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        avatar: true,
                        createdAt: true,
                        updatedAt: true
                    }
                },
                reactions: true
            }
        });

        return NextResponse.json(updatedMessage);

    } catch (error) {
        console.error("[REACTION_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
