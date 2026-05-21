import type { Metadata } from "next";
import Link from "next/link";
import { RefractiveDock } from "@/components/navbar";
import { Footer } from "@/components/Footer";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Affiliate Program — MarrowStack",
  description:
    "Earn 25% on every sale you refer to MarrowStack. One-time purchases, no subscription churn.",
};

const RULES = [
  "25% commission on every referred sale (one-time purchases).",
  "Payout threshold: $25. Manual payout via bank transfer or USDC on request.",
  "Your referral link is tied to your account — sign in to generate it.",
  "No cookie window limit: if your referral ever purchases, you earn.",
  "Subscription tier (when launched): 20% recurring commission.",
  "No mass-spam or incentivised-click campaigns allowed.",
];

export default function AffiliatePage() {
  return (
    <div className="min-h-screen font-display">
      <RefractiveDock />

      <main className="container mx-auto max-w-2xl px-4 pt-40 pb-24">
        <p
          className="text-xs font-bold uppercase tracking-[0.2em] mb-4"
          style={{ color: "hsl(var(--accent-mineral))" }}
        >
          Affiliate
        </p>
        <h1 className="text-4xl font-black text-reveal-light leading-tight mb-4">
          Refer developers, earn 25%.
        </h1>
        <p className="text-[15px] mb-12" style={{ color: "hsl(var(--accent-mineral))" }}>
          MarrowStack pays 25% on every sale you refer. No recurring subscription to
          worry about — one-time purchases, straightforward math.
        </p>

        {/* Rules */}
        <div
          className="rounded-xl border p-6 mb-10"
          style={{
            borderColor: "hsl(var(--metal-border))",
            background: "var(--metal-gradient)",
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "hsl(var(--metal-shine))" }}>
            How it works
          </p>
          <ul className="space-y-3">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-3">
                <Check
                  size={13}
                  className="mt-0.5 shrink-0"
                  style={{ color: "hsl(var(--metal-shine))" }}
                />
                <span className="text-[14px]" style={{ color: "hsl(var(--metal-foreground))" }}>
                  {rule}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div
          className="rounded-xl border p-6 text-center"
          style={{
            borderColor: "hsl(var(--metal-border))",
            background: "var(--metal-gradient)",
          }}
        >
          <p className="text-sm font-bold mb-2" style={{ color: "hsl(var(--metal-foreground))" }}>
            Get your referral link
          </p>
          <p className="text-[13px] mb-5" style={{ color: "hsl(var(--accent-mineral))" }}>
            Sign in to your account to generate a personal referral link and track
            your earnings. Recruitment is currently manual — email us to get approved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-bold border transition-all hover:opacity-80"
              style={{
                background: "hsl(var(--metal-foreground))",
                color: "hsl(var(--background))",
                borderColor: "hsl(var(--metal-foreground))",
              }}
            >
              Sign in to generate link
            </Link>
            <a
              href="mailto:samarth@marrowstack.dev?subject=Affiliate%20application"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium border transition-all hover:opacity-80"
              style={{
                borderColor: "hsl(var(--metal-border))",
                color: "hsl(var(--metal-foreground))",
              }}
            >
              Apply via email
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
