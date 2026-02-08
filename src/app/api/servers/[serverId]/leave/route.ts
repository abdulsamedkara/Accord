import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST - Leave server
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

        // Check if user is member
        const member = await db.member.findUnique({
            where: {
                userId_serverId: {
                    userId: user.id,
                    serverId,
                },
            },
        });

        if (!member) {
            return NextResponse.json(
                { error: "You are not a member of this server" },
                { status: 400 }
            );
        }

        // Owner cannot leave (they must delete or transfer ownership)
        if (member.role === "OWNER") {
            return NextResponse.json(
                { error: "Owner cannot leave the server. Delete or transfer ownership instead." },
                { status: 400 }
            );
        }

        await db.member.delete({
            where: {
                userId_serverId: {
                    userId: user.id,
                    serverId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Leave server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
