"use client";

import { useAppStore } from "@/store";
import { Plus } from "lucide-react";

export default function HomePage() {
    const { user, servers, setCreateServerModalOpen } = useAppStore();

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[hsl(var(--chat-bg))] p-8 text-center">
            <div className="max-w-md">
                <h1 className="text-3xl font-bold mb-4">
                    Welcome to Accord{user ? `, ${user.username}` : ""}!
                </h1>
                <p className="text-[hsl(var(--muted-foreground))] mb-8">
                    {servers.length === 0
                        ? "You haven't joined any servers yet. Create one to get started!"
                        : "Select a server from the sidebar to start chatting."}
                </p>

                {servers.length === 0 && (
                    <button
                        onClick={() => setCreateServerModalOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-md font-medium hover:bg-[hsl(var(--primary))]/90 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Your First Server
                    </button>
                )}
            </div>
        </div>
    );
}
