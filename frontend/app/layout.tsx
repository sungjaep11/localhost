import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/context/SocketContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LOCAL HOST",
  description: "음악 게임 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SocketProvider>
          <div id="app-root" style={{ overflowX: 'hidden', maxWidth: '100%', width: '100%', minWidth: 0, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </SocketProvider>
      </body>
    </html>
  );
}
