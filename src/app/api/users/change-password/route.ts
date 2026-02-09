import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        // Fetch user with password (getCurrentUser select doesn't include password)
        const dbUser = await db.user.findUnique({
            where: { id: user.id }
        });

        if (!dbUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Verify current password
        const isPasswordValid = await verifyPassword(currentPassword, dbUser.password);

        if (!isPasswordValid) {
            return new NextResponse("Invalid current password", { status: 401 });
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update user
        await db.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword
            }
        });

        return new NextResponse("Password updated successfully", { status: 200 });

    } catch (error) {
        console.error("[USER_PASSWORD_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
