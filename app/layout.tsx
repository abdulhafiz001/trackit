import type { Metadata } from "next";
import { Sora, DM_Sans, Geist } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const sora = Sora({ 
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap" 
});

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap" 
});

export const metadata: Metadata = {
  title: "TrackIT | Digital IT & SIWES Logbook for Nigerian Students",
  description: "Replace your physical logbook with TrackIT. The structured digital experience for Nigerian students to track tasks, log challenges, and document their Industrial Training (IT/SIWES) period with AI assistance.",
  keywords: "IT logbook, SIWES logbook, Nigerian students, Industrial Training, Digital Logbook, TrackIT, Student Logbook App",
  authors: [{ name: "TrackIT" }],
  openGraph: {
    title: "TrackIT | Digital IT & SIWES Logbook",
    description: "Replace your physical logbook with TrackIT. The structured digital experience for Nigerian students.",
    type: "website",
    locale: "en_NG",
    siteName: "TrackIT",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body
        className={`${sora.variable} ${dmSans.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
