"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { ServerSidebar } from "@/components/server/server-sidebar";
import { CreateServerModal } from "@/components/server/create-server-modal";

export default function HomePage() {
  const router = useRouter();
  const {
    user,
    setUser,
    servers,
    setServers,
    isCreateServerModalOpen,
    setCreateServerModalOpen,
  } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch("/api/auth/me");
        const userData = await userRes.json();

        if (!userData.user) {
          router.replace("/login");
          return;
        }

        setUser(userData.user);

        const serversRes = await fetch("/api/servers");
        const serversData = await serversRes.json();
        setServers(serversData.servers || []);

        // If user has servers, redirect to first server
        if (serversData.servers && serversData.servers.length > 0) {
          const firstServer = serversData.servers[0];
          const firstChannel = firstServer.channels?.find(
            (c: { type: string }) => c.type === "TEXT"
          );
          if (firstChannel) {
            router.replace(`/servers/${firstServer.id}/channels/${firstChannel.id}`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, setUser, setServers]);

  const handleServerClick = (serverId: string) => {
    if (!serverId) return;

    const server = servers.find((s) => s.id === serverId);
    if (server) {
      const firstTextChannel = server.channels.find((c) => c.type === "TEXT");
      if (firstTextChannel) {
        router.push(`/servers/${serverId}/channels/${firstTextChannel.id}`);
      }
    }
  };

  const handleJoinServer = () => {
    setJoinError("");

    // Extract code from URL or use directly
    let code = inviteCode.trim();

    // If it's a full URL, extract the code
    const urlMatch = code.match(/invite\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) {
      code = urlMatch[1];
    }

    if (!code) {
      setJoinError("Lütfen davet kodu girin");
      return;
    }

    router.push(`/invite/${code}`);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
          <p className="text-[hsl(var(--muted-foreground))]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <ServerSidebar
        servers={servers}
        currentServerId={null}
        onServerClick={handleServerClick}
        onCreateServer={() => setCreateServerModalOpen(true)}
      />

      <main className="flex-1 flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-center max-w-md px-4">
          <h1 className="text-3xl font-bold mb-4">Accord'a Hoş Geldin! 🎉</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">
            {servers.length === 0
              ? "Henüz hiçbir sunucuya katılmadın. Yeni bir sunucu oluştur veya bir davet linki ile katıl."
              : "Sol menüden bir sunucu seç veya yeni bir sunucu oluştur."}
          </p>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => setCreateServerModalOpen(true)}
              className="w-full px-6 py-3 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/80 text-white font-semibold rounded-md transition-colors"
            >
              Sunucu Oluştur
            </button>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-[hsl(var(--border))]"></div>
              <span className="flex-shrink mx-4 text-[hsl(var(--muted-foreground))] text-sm">veya</span>
              <div className="flex-grow border-t border-[hsl(var(--border))]"></div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinServer()}
                  placeholder="Davet linki veya kodu yapıştır"
                  className="flex-1 px-4 py-3 bg-[hsl(var(--input))] rounded-md text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                />
                <button
                  onClick={handleJoinServer}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors"
                >
                  Katıl
                </button>
              </div>
              {joinError && (
                <p className="text-red-400 text-sm">{joinError}</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <CreateServerModal
        open={isCreateServerModalOpen}
        onOpenChange={setCreateServerModalOpen}
      />
    </div>
  );
}

