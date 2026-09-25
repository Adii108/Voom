import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Zoom Workplace",
  description: "Zoom Web Client public UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-white text-[#2A2B2D] min-h-screen selection:bg-blue-500/20 selection:text-blue-700`}
      >
        {children}
      </body>
    </html>
  );
}
