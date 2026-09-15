import type { Metadata } from "next";
import "./globals.css";
import "./search.css";

export const metadata: Metadata = {
  title: "Solar System Explorer",
  description: "Explore the solar system in 3D. Fly between worlds, discover their stories and compare real astronomical distances.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
