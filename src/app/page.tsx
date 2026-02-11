"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Headphones, MonitorUp, Shield, Download, ArrowRight, Users } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // If user is already logged in, redirect to their servers
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          // User is authenticated, redirect to servers
          const serversRes = await fetch("/api/servers");
          const serversData = await serversRes.json();
          if (serversData.servers?.length > 0) {
            const firstServer = serversData.servers[0];
            const firstChannel = firstServer.channels?.find(
              (c: { type: string }) => c.type === "TEXT"
            );
            if (firstChannel) {
              router.replace(`/servers/${firstServer.id}/channels/${firstChannel.id}`);
              return;
            }
          }
        }
      } catch {
        // Not authenticated, show landing page
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1a1b1e]">
        <div className="w-12 h-12 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1b1e]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5865F2] to-[#7289da] flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold">Accord</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/download"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              İndir
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752c4] rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:shadow-[#5865F2]/25"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#5865F2]/10 rounded-full blur-[128px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-7xl font-extrabold leading-tight mb-6">
            <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              Arkadaşlarınla
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#5865F2] to-[#7289da] bg-clip-text text-transparent">
              Konuş, Paylaş, Eğlen
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Accord, arkadaşlarınla sesli ve yazılı sohbet yapabileceğin,
            ekranını paylaşabileceğin modern bir iletişim platformu.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/download"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#5865F2] hover:bg-[#4752c4] rounded-xl text-base font-semibold transition-all hover:shadow-2xl hover:shadow-[#5865F2]/30 hover:-translate-y-0.5"
            >
              <Download className="w-5 h-5" />
              Windows için İndir
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5"
            >
              Tarayıcıda Aç
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Her Şey Bir Arada
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              İletişim için ihtiyacın olan tüm araçlar, tek bir platformda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Yazılı Sohbet"
              description="Sunucularında metin kanalları oluştur, arkadaşlarınla gerçek zamanlı mesajlaş."
              gradient="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={<Headphones className="w-6 h-6" />}
              title="Sesli Kanallar"
              description="Yüksek kaliteli ses ile arkadaşlarınla konuş. Mikrofon ve kulaklık kontrolü."
              gradient="from-green-500 to-emerald-500"
            />
            <FeatureCard
              icon={<MonitorUp className="w-6 h-6" />}
              title="Ekran Paylaşımı"
              description="Ekranını veya uygulama penceresini tek tıkla paylaş."
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Sunucu & Davet"
              description="Kendi sunucunu oluştur, arkadaşlarını davet et, rolleri yönet."
              gradient="from-orange-500 to-red-500"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-[#5865F2]/20 to-[#7289da]/5 border border-[#5865F2]/10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Hemen Başla
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Ücretsiz hesap oluştur ve arkadaşlarınla sohbete başla.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#5865F2] hover:bg-[#4752c4] rounded-xl text-base font-semibold transition-all hover:shadow-2xl hover:shadow-[#5865F2]/30"
              >
                <Shield className="w-5 h-5" />
                Kayıt Ol
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-base font-semibold transition-all"
              >
                Giriş Yap
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#5865F2] to-[#7289da] flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span>Accord © 2026</span>
          </div>
          <div className="flex gap-6">
            <Link href="/download" className="hover:text-white transition-colors">İndir</Link>
            <a href="https://github.com/abdulsamedkara/Accord" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group p-6 rounded-2xl bg-[#2b2d31]/50 border border-white/5 hover:border-[#5865F2]/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#5865F2]/5">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 text-white shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
