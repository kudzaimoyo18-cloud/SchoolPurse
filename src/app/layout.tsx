import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { PostHogProvider } from "@/components/posthog-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GooeyFilter } from "@/components/ui/gooey-toggle";
import { SwRegister } from "@/components/sw-register";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SchoolPurse — School Finance Tracker",
  description:
    "Internal accounting and fee-tracking dashboard for Zimbabwean schools.",
  applicationName: "SchoolPurse",
  appleWebApp: {
    capable: true,
    title: "SchoolPurse",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#102a43",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          storageKey="schoolpurse.theme"
        >
          <QueryProvider>
            <TooltipProvider delay={200}>
              <PostHogProvider>{children}</PostHogProvider>
              <Toaster richColors position="top-right" />
              <GooeyFilter />
              <SwRegister />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
