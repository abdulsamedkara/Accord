import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, email, password } = body;

        // Validation
        if (!username || !password) {
            return NextResponse.json(
                { error: "Username and password are required" },
                { status: 400 }
            );
        }

        if (username.length < 3 || username.length > 32) {
            return NextResponse.json(
                { error: "Username must be between 3 and 32 characters" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Check if username exists
        const existingUser = await db.user.findFirst({
            where: {
                OR: [
                    { username: username.toLowerCase() },
                    ...(email ? [{ email: email.toLowerCase() }] : []),
                ],
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Username or email already exists" },
                { status: 400 }
            );
        }

        // Create user
        const hashedPassword = await hashPassword(password);
        const user = await db.user.create({
            data: {
                username: username.toLowerCase(),
                email: email?.toLowerCase() || null,
                password: hashedPassword,
            },
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                createdAt: true,
            },
        });

        // Create token
        const token = createToken({ userId: user.id, username: user.username });

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set("accord-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
