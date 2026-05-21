import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Background } from "@/components/ui/background";
import { SessionProvider } from "@/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MarrowStack — Production TypeScript Blocks for Next.js",
  description:
    "Production-ready TypeScript blocks for Next.js: Auth, Admin, Team Workspace, Solana Auth (SIWS), and USDC Payments. Copy a file, run a migration, ship.",
  metadataBase: new URL("https://marrowstack.dev"),
  openGraph: {
    title: "MarrowStack — Production TypeScript Blocks for Next.js",
    description:
      "Production-ready TypeScript blocks for Next.js: Auth, Admin, Team Workspace, Solana Auth (SIWS), and USDC Payments. Copy a file, run a migration, ship.",
    url: "https://marrowstack.dev",
    siteName: "MarrowStack",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MarrowStack — Production TypeScript Blocks for Next.js",
    description:
      "Production-ready TypeScript blocks for Next.js: Auth, Admin, Team Workspace, Solana Auth (SIWS), and USDC Payments. Copy a file, run a migration, ship.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <Background className="fixed inset-0 z-0 pointer-events-none" />
            <main className="relative z-10 text-foreground">
              {children}
            </main>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
