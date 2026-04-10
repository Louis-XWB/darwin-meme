import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Darwin.meme \u2014 AI Evolution Arena",
  description: "Watch AI agents evolve strategies in a simulated meme token market",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${mono.variable} font-sans bg-gray-950 text-gray-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
