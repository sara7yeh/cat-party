"use client";

import Script from "next/script";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function Analytics() {
  if (!GA_ID) return null;

  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
    <Script id="google-analytics" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', '${GA_ID}', { anonymize_ip: true, send_page_view: true });
    `}</Script>
  </>;
}

export function trackEvent(name: string, parameters: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined" || !GA_ID || typeof window.gtag !== "function") return;
  window.gtag("event", name, parameters);
}
