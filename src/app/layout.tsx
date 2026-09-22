import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ReelFlights: Find your next trip.",
    template: "%s - ReelFlights",
  },
  description:
    "ReelFlights shows you where you can fly for the price you want. Pick a departure airport and a month, and discover destinations by price.",
  openGraph: {
    title: "ReelFlights: Find your next trip.",
    description: "Discover flight destinations by price, not by destination.",
    url: SITE_URL,
    siteName: "ReelFlights",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReelFlights: Find your next trip.",
    description: "Discover flight destinations by price, not by destination.",
  },
};

export const viewport = {
  themeColor: "#f6f2ea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${workSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
