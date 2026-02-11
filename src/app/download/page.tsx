import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DownloadPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#313338] text-white p-4">
            <div className="max-w-md text-center space-y-6">
                <h1 className="text-4xl font-bold">Download Accord</h1>
                <p className="text-gray-300">
                    Experiencing the best way to chat with your friends.
                </p>

                <div className="p-6 bg-[#2b2d31] rounded-lg border border-[#1e1f22]">
                    <h2 className="text-xl font-semibold mb-2">Windows Desktop App</h2>
                    <p className="text-sm text-gray-400 mb-4">Version 1.0.0</p>

                    {/* 
            Note: Since the .exe is large, we usually host it on GitHub Releases or AWS S3.
            For now, this button allows the user to contact the admin or check a specific link.
          */}
                    <Button asChild className="w-full bg-[#5865F2] hover:bg-[#4752c4]">
                        {/* Placeholder link - User needs to upload the .exe somewhere real */}
                        <Link href="#">Download Link (Contact Admin)</Link>
                    </Button>
                </div>

                <Button asChild variant="link" className="text-gray-400">
                    <Link href="/">Back to Web App</Link>
                </Button>
            </div>
        </div>
    );
}
