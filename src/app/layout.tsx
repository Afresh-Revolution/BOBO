import type { Metadata } from "next";
import { siteConfig } from "@/lib/content";
import "./globals.scss";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} · ${siteConfig.fullName}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "BOBO",
    "Battle Of Baddies On",
    "Nigerian reality TV",
    "CBrilliance",
    "Popin",
  ],
  openGraph: {
    title: `${siteConfig.name} · ${siteConfig.fullName}`,
    description: siteConfig.description,
    type: "website",
    locale: "en_NG",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} · ${siteConfig.fullName}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&f[]=satoshi@400,500,700&f[]=general-sans@500,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
