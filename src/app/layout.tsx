import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/context/AuthContext";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import "./globals.css";

export const metadata: Metadata = {
  title: "Le Paradise HRMS - Hotel & Resort Staff Management",
  description: "Modern enterprise human resources management system for Le Paradise Resorts",
  manifest: "/manifest.json",
  themeColor: "#2D7A58",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2D7A58" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased font-sans bg-white">
        <AuthProvider>
          {children}
          <PushNotificationManager />
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
