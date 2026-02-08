import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { BottomNav } from "@/components/BottomNav";
import { FloatingPositionsButton } from "@/components/FloatingPositions";
import { OnboardingTour } from "@/components/OnboardingTour";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

export const metadata: Metadata = {
  title: "Pulse - Prediction Markets",
  description: "Mobile-first prediction markets",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${sourceSans.variable} bg-[#FAFAF9] text-gray-900 pb-20`}
      >
        <Providers>
          <Header />
          {children}
          <OnboardingTour />
          <FloatingPositionsButton />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
