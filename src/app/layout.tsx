import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Earth Online RPG",
  description: "Turn a life well lived into an adventure worth remembering.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
