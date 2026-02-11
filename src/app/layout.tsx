import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TitleBar } from "@/components/title-bar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Accord",
  description: "A private Discord-like chat application for you and your friends",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#313338] overflow-hidden`}>
        <TitleBar />
        <main className="h-[calc(100vh-2rem)] mt-8">
          {children}
        </main>
      </body>
    </html>
  );
}
