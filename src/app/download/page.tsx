import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Download, ExternalLink, Monitor } from "lucide-react";

export default function DownloadPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#1a1b1e] via-[#2b2d31] to-[#1a1b1e] text-white flex flex-col">
            {/* Nav */}
            <nav className="flex items-center justify-between p-6 max-w-6xl mx-auto w-full">
                <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-[#5865F2] to-[#7289da] bg-clip-text text-transparent">
                    Accord
                </Link>
                <div className="flex gap-4">
                    <Button asChild variant="ghost" className="text-gray-300 hover:text-white">
                        <Link href="/login">Giriş Yap</Link>
                    </Button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4">
                <div className="max-w-lg w-full text-center space-y-8">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5865F2] to-[#7289da] flex items-center justify-center shadow-2xl shadow-[#5865F2]/30">
                            <Monitor className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    <div>
                        <h1 className="text-4xl font-bold mb-3">Accord İndir</h1>
                        <p className="text-gray-400 text-lg">
                            Masaüstü uygulamasıyla daha iyi bir deneyim yaşayın.
                        </p>
                    </div>

                    {/* Download Card */}
                    <div className="p-8 bg-[#313338]/80 backdrop-blur-sm rounded-2xl border border-[#404249] space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold mb-1">Windows Desktop App</h2>
                            <p className="text-sm text-[#5865F2] font-medium">v1.0.1</p>
                        </div>

                        <div className="space-y-3">
                            <Button asChild className="w-full h-12 bg-[#5865F2] hover:bg-[#4752c4] text-base font-semibold gap-2 transition-all hover:shadow-lg hover:shadow-[#5865F2]/25">
                                <a href="https://github.com/abdulsamedkara/Accord/releases/latest/download/Accord-Setup.exe">
                                    <Download className="w-5 h-5" />
                                    İndir (Setup.exe)
                                </a>
                            </Button>

                            <Button asChild variant="outline" className="w-full h-10 border-[#404249] bg-transparent hover:bg-[#404249] text-gray-300 hover:text-white gap-2">
                                <a href="https://github.com/abdulsamedkara/Accord/releases" target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4" />
                                    Tüm Sürümler (GitHub)
                                </a>
                            </Button>
                        </div>

                        <p className="text-xs text-gray-500">
                            Windows 10/11 • 64-bit • ~250 MB
                        </p>
                    </div>

                    {/* Back Link */}
                    <div className="flex justify-center gap-4">
                        <Button asChild variant="link" className="text-gray-400 hover:text-white">
                            <Link href="/">Ana Sayfa</Link>
                        </Button>
                        <span className="text-gray-600">•</span>
                        <Button asChild variant="link" className="text-gray-400 hover:text-white">
                            <Link href="/login">Web Uygulaması</Link>
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
