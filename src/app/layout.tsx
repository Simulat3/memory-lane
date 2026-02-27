import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nostalgia Calendar",
  description: "Brought to you by Y2K where nostalgia fuels the future",
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
