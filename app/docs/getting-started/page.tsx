import React from "react";
import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";

export const metadata: Metadata = {
  title: "Getting Started — MarrowStack Docs",
  description: "Install a MarrowStack block into an existing Next.js app. Prerequisites, Supabase setup, and env vars.",
};

export default function GettingStartedPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Getting Started
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Quick start</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          A MarrowStack block is a TypeScript file. There is no CLI, no code generation, and no
          dependency on the MarrowStack package. Copy the file, run the migration, set env vars.
        </p>
      </div>

      <Section title="Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <li>Next.js 14 or 15 (App Router)</li>
          <li>TypeScript 5+ with <code className="font-mono text-[11px]">strict: true</code></li>
          <li>Supabase project (free tier works)</li>
          <li>Node.js 18+ or Bun 1.x</li>
        </ul>
      </Section>

      <Section title="1. Purchase and access">
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          After purchase, you receive GitHub repository access within seconds. The repository contains one
          directory per block. Clone it and copy the block you purchased.
        </p>
        <CodeBlock language="bash" code={`git clone https://github.com/MarrowStack/blocks your-blocks
cp -r your-blocks/auth   your-app/src/blocks/auth
cp -r your-blocks/admin  your-app/src/blocks/admin`} />
      </Section>

      <Section title="2. Run the SQL migration">
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Each block ships with a SQL migration. Run it in your Supabase project once, before starting the app.
          The migration creates the required tables, indexes, and RLS policies.
        </p>
        <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <li>Open Supabase Dashboard → SQL Editor.</li>
          <li>Paste the SQL from the <code className="font-mono text-[11px]">MIGRATION</code> constant at the top of the block file.</li>
          <li>Run it. RLS is enabled automatically.</li>
        </ol>
      </Section>

      <Section title="3. Set environment variables">
        <p className="text-sm leading-relaxed mb-3" style={{ color: "hsl(var(--accent-mineral))" }}>
          Required vars are documented at the top of each block file and in the block's docs page.
          The core vars shared by all blocks:
        </p>
        <CodeBlock language="bash" code={`# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # never expose client-side

# For Solana blocks only
NEXT_PUBLIC_SOLANA_CLUSTER=devnet     # or mainnet-beta
SOLANA_AUTH_DOMAIN=yourdomain.com
SOLANA_TREASURY_ADDRESS=YourBase58PublicKey`} />
      </Section>

      <Section title="4. Mount API routes">
        <p className="text-sm leading-relaxed mb-3" style={{ color: "hsl(var(--accent-mineral))" }}>
          Each block exports named handler functions. Mount them as Next.js App Router route handlers.
        </p>
        <CodeBlock language="typescript" code={`// app/api/auth/[...nextauth]/route.ts
import { authOptions } from '@/blocks/auth'
import NextAuth from 'next-auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }`} />
      </Section>

      <Section title="5. Use the exports">
        <p className="text-sm leading-relaxed mb-3" style={{ color: "hsl(var(--accent-mineral))" }}>
          All business logic is exported as async functions. Call them directly from server components,
          server actions, or route handlers.
        </p>
        <CodeBlock language="typescript" code={`import { getDashboardStats, requireAdmin } from '@/blocks/admin'
import { getServerSession }                from 'next-auth'
import { authOptions }                     from '@/blocks/auth'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  requireAdmin(session)  // throws 401/403 if insufficient role

  const stats = await getDashboardStats()
  // ...
}`} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold" style={{ color: "hsl(var(--metal-foreground))" }}>{title}</h2>
      {children}
    </div>
  );
}
