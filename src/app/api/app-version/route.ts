import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        version: "1.0.0", // Manually update this when releasing a new EXE
        downloadUrl: "https://accord-production-fa47.up.railway.app/download" // Placeholder
    });
}
