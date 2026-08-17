import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "The Ballpit",
  description: "Sports, pop culture, and satire — jump in.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} antialiased`}>
        <SiteHeader />
        <div className="min-h-[calc(100vh-4rem)]">{children}</div>
        <footer className="border-t border-white/[0.06] mt-10">
          <div className="max-w-6xl mx-auto px-4 py-8 text-center">
            <div className="text-sm font-semibold">
              <span className="metal-title">The </span>
              <span className="copper-title">Ballpit</span>
            </div>
            <p className="text-xs text-metal-steel mt-1 tracking-wide">
              Sports & Pop Culture
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
