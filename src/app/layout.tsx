import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Caveat, Kalam } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SettingsProvider } from "@/components/layout/settings-context";
import { V2Provider } from "@/components/layout/v2-context";
import { OnboardingProvider } from "@/components/layout/onboarding-context";
import { AppShell } from "@/components/layout/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: "italic",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const kalam = Kalam({
  variable: "--font-kalam",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIssistant - AI Life Planning",
  description: "AI-powered life planning assistant for goals, tasks, and certifications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${caveat.variable} ${kalam.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
          <V2Provider>
          <OnboardingProvider>
          <TooltipProvider>
            <AppShell>
              {children}
            </AppShell>
          </TooltipProvider>
          </OnboardingProvider>
          </V2Provider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
