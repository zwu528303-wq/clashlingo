import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "ClashLingo",
    template: "%s | ClashLingo",
  },
  description:
    "Scenario-based language practice with timed stages, standard-answer review, and optional friend rivalries.",
  applicationName: "ClashLingo",
  authors: [{ name: "ClashLingo" }],
  keywords: [
    "language learning",
    "scenario practice",
    "AI language tutor",
    "French practice",
    "English practice",
    "Spanish practice",
  ],
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: "ClashLingo",
    description:
      "Practice real-life language scenarios, clear timed stages, and keep friend rivalries for weekly competition.",
    siteName: "ClashLingo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClashLingo",
    description:
      "Practice real-life language scenarios, clear timed stages, and keep friend rivalries for weekly competition.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={plusJakartaSans.className}>{children}</body>
    </html>
  );
}
