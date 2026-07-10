import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "./analytics";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "猫咪派对 · 一台手机随时开喵",
  description: "软乎乎的多人聚会游戏合集、抽签与奖惩工具。",
  manifest: `${basePath}/manifest.webmanifest`,
  icons: { icon: `${basePath}/icons/ui/party.png`, apple: `${basePath}/icons/ui/party.png` },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "猫咪派对" },
};

export const viewport: Viewport = { themeColor: "#fffbf5", width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}<Analytics /></body></html>;
}
