import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "猫咪派对 · 一台手机随时开喵",
  description: "软乎乎的多人聚会游戏合集、抽签与奖惩工具。",
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/manifest.webmanifest`,
  icons: { icon: "/icons/ui/party.png", apple: "/icons/ui/party.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "猫咪派对" },
};

export const viewport: Viewport = { themeColor: "#fffbf5", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
