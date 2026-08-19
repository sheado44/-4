import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import ThemeApplier from "@/components/ThemeApplier";

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "theBallpit",
  applicationName: "theBallpit",
  appleWebApp: { title: "theBallpit" },
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
        <ThemeApplier />
        <SiteHeader />
        <div className="min-h-[calc(100vh-4rem)]">{children}</div>
        <footer
          className="mt-10 border-t"
          style={{ borderColor: "rgba(127,127,127,0.18)" }}
        >
          <div className="max-w-6xl mx-auto px-4 py-8 text-center">
            <div className="text-sm font-semibold" style={{ color: "var(--pit-text)" }}>
              theBallpit
            </div>
            <p className="text-xs mt-1 tracking-wide" style={{ color: "var(--pit-muted)" }}>
              Sports · Pop Culture · Satire
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
