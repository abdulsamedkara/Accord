import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { username, email } = await req.json();

        // 1. Check if username is taken (by someone else)
        if (username && username !== user.username) {
            const existingUser = await db.user.findUnique({
                where: { username }
            });

            if (existingUser) {
                return new NextResponse("Username already taken", { status: 400 });
            }
        }

        // 2. Check if email is taken (by someone else)
        if (email && email !== user.email) {
            const existingUser = await db.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return new NextResponse("Email already taken", { status: 400 });
            }
        }

        const updatedUser = await db.user.update({
            where: { id: user.id },
            data: {
                username,
                email
            }
        });

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error("[USER_PROFILE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
