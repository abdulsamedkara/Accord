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

        const server = await db.server.findFirst({
            where: {
                inviteCode: inviteCode,
            },
        });

        if (!server) {
            return new NextResponse("Invalid invite code", { status: 404 });
        }

        // Check if already a member
        const existingMember = await db.member.findFirst({
            where: {
                serverId: server.id,
                userId: user.id,
            },
        });

        if (existingMember) {
            return NextResponse.json({ serverId: server.id, message: "Already a member" });
        }

        // Add member
        await db.member.create({
            data: {
                serverId: server.id,
                userId: user.id,
                role: "MEMBER",
            },
        });

        return NextResponse.json({ serverId: server.id });
    } catch (error) {
        console.error("[SERVER_JOIN_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
