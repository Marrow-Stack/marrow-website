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
    images: [{ url: "https://marrowstack.dev/api/og?title=MarrowStack&description=Production+TypeScript+blocks+for+Next.js", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MarrowStack — Production TypeScript Blocks for Next.js",
    description:
      "Production-ready TypeScript blocks for Next.js: Auth, Admin, Team Workspace, Solana Auth (SIWS), and USDC Payments. Copy a file, run a migration, ship.",
    images: ["https://marrowstack.dev/api/og?title=MarrowStack&description=Production+TypeScript+blocks+for+Next.js"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://marrowstack.dev/#org",
      name: "MarrowStack",
      url: "https://marrowstack.dev",
      logo: "https://marrowstack.dev/logo.png",
      sameAs: ["https://github.com/Marrow-Stack"],
    },
    {
      "@type": "WebSite",
      "@id": "https://marrowstack.dev/#website",
      url: "https://marrowstack.dev",
      name: "MarrowStack",
      publisher: { "@id": "https://marrowstack.dev/#org" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://marrowstack.dev/blocks?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
