import type { Metadata } from "next";
import { Red_Hat_Display, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import KeepAliveProvider from "@/components/KeepAliveProvider";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { ThemeProvider } from "@/components/theme-provider";
import { SmoothCursor } from "@/components/ui/smooth-cursor";

const redHat = Red_Hat_Display({
  variable: "--font-red-hat-display",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Millenium Potters",
  description:
    "Millenium Potters is a loan management platform that helps businesses and individuals streamline loan applications, approvals, repayments, and reporting with ease.",
  icons: {
    icon: "/logo-favicon.png",
    shortcut: "/logo-favicon.png",
    apple: "/logo-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${redHat.variable} ${geistMono.variable} font-red-hat antialiased bg-gray-50 dark:bg-gray-900 min-h-screen`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SmoothCursor />
          <CompanyProvider>
            <KeepAliveProvider />
            {children}
            {/* ✅ Global Sonner Toaster */}
            <Toaster richColors position="top-right" duration={6000} />
          </CompanyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
