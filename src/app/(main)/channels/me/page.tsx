"use client";

import { useAppStore } from "@/store";
import { Plus, UserPlus } from "lucide-react";

export default function HomePage() {
    const { user, servers, setCreateServerModalOpen, setJoinServerModalOpen } = useAppStore();

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#313338] p-8 text-center text-white">
            <div className="max-w-md">
                <h1 className="text-3xl font-bold mb-4">
                    Hoş geldin{user ? `, ${user.username}` : ""}!
                </h1>
                <p className="text-zinc-400 mb-8">
                    {servers.length === 0
                        ? "Henüz herhangi bir sunucuya katılmadın. Başlamak için bir tane oluştur veya arkadaşının davet kodunu gir!"
                        : "Sohbete başlamak için soldaki menüden bir sunucu seç."}
                </p>

                {servers.length === 0 && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => setCreateServerModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#5865F2] text-white rounded-md font-medium hover:bg-[#4752c4] transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Sunucu Oluştur
                        </button>
                        <button
                            onClick={() => setJoinServerModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2b2d31] text-white rounded-md font-medium hover:bg-[#1e1f22] transition-colors"
                        >
                            <UserPlus className="w-5 h-5" />
                            Sunucuya Katıl
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
