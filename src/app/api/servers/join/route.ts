import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { inviteCode } = await req.json();

        if (!inviteCode) {
            return new NextResponse("Invite code missing", { status: 400 });
        }

        // 1. Check Invite table
        const invite = await db.invite.findFirst({
            where: { code: inviteCode },
        });

        let serverId = null;

        if (invite) {
            // Check usage limits
            if (invite.maxUses && invite.uses >= invite.maxUses) {
                return new NextResponse("Invite limit reached", { status: 410 });
            }
            // Check expiration
            if (invite.expiresAt && new Date() > invite.expiresAt) {
                return new NextResponse("Invite expired", { status: 410 });
            }

            serverId = invite.serverId;

            // Increment usage
            await db.invite.update({
                where: { id: invite.id },
                data: { uses: { increment: 1 } }
            });
        } else {
            // 2. Fallback: Check Server table (vanity/default code)
            const server = await db.server.findFirst({
                where: { inviteCode: inviteCode },
            });
            if (server) {
                serverId = server.id;
            }
        }

        if (!serverId) {
            return new NextResponse("Invalid invite code", { status: 404 });
        }

        // Check availability of server (optional, but good practice)
        const server = await db.server.findUnique({
            where: { id: serverId }
        });

        if (!server) {
            return new NextResponse("Server not found", { status: 404 });
        }


        // Check if already a member
        const existingMember = await db.member.findFirst({
            where: {
                serverId: serverId,
                userId: user.id,
            },
        });

        if (existingMember) {
            return NextResponse.json({ serverId: serverId, message: "Already a member" });
        }

        // Add member
        await db.member.create({
            data: {
                serverId: serverId,
                userId: user.id,
                role: "MEMBER",
            },
        });

        return NextResponse.json({ serverId: serverId });
    } catch (error) {
        console.error("[SERVER_JOIN_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
