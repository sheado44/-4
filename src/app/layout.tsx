import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PressMe – Ranked Sports & Pop Culture Writing",
  description: "Public articles reviewed by AI for authenticity, accuracy & form. We don’t make sports fun. You do!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-forge-950 text-gray-100 min-h-screen">
        <nav className="border-b border-forge-800 bg-forge-900/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-forge-accent">Press</span>Me
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="hover:text-forge-accent transition">
                Home
              </Link>
              <Link href="/?section=sports" className="hover:text-forge-accent transition">
                Sports
              </Link>
              <Link href="/?section=pop" className="hover:text-forge-accent transition">
                Pop Culture
              </Link>
              <Link href="/editor" className="bg-forge-accent hover:bg-forge-accentHover text-white px-4 py-2 rounded-lg transition">
                Write Article
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="w-8 h-8 rounded-full bg-forge-700 flex items-center justify-center text-sm font-bold"
              >
                MS
              </Link>
            </div>
          </div>
        </nav>
        {children}
        <footer className="border-t border-forge-800 py-8 text-center text-sm text-gray-500 mt-12">
          <p className="italic text-forge-accent mb-1">“We don’t make sports fun. You do!”</p>
          <p>PressMe – Public sports & pop culture writing, AI-reviewed, community-ranked.</p>
          <p className="mt-1">pressme.ai • Prototype</p>
        </footer>
      </body>
    </html>
  );
}
