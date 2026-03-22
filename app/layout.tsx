import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open Sentinel",
  description:
    "A policy-first wallet control plane for AI agents powered by MoonPay CLI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
