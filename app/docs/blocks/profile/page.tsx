import React from "react"
import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "User Profile — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack User Profile block: avatar upload, Zod validation, notification preferences, soft-delete.",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: "hsl(var(--metal-foreground))" }}>{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
        {children}
      </div>
    </section>
  )
}

export default function ProfileDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Auth &amp; Users · Starter
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">User Profile</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Profile editing form with avatar upload to Supabase Storage, Zod validation, notification preferences,
          and soft-delete account removal. Designed to sit on top of the Auth block's <InlineCode>profiles</InlineCode> table.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/profile" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>User Profile block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/profile.ts</InlineCode> into your project.
          The SQL migration is embedded in the <InlineCode>MIGRATION</InlineCode> constant.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>Supabase project with the Auth block running (reads the <InlineCode>profiles</InlineCode> table)</li>
          <li>A Supabase Storage bucket named <InlineCode>avatars</InlineCode> (public or private)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Copy <InlineCode>lib/profile.ts</InlineCode> from the block detail page and paste it into your project.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install @supabase/supabase-js zod`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_SUPABASE_URL",      required: true,  desc: "Your Supabase project URL" },
          { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true,  desc: "Anon key — used client-side for avatar uploads" },
          { name: "SUPABASE_SERVICE_ROLE_KEY",     required: true,  desc: "Service role key — used server-side to update profiles" },
          { name: "AVATAR_BUCKET",                 required: false, desc: "Storage bucket name. Defaults to avatars" },
        ]} />
      </Section>

      <Section title="5. Database">
        <p>
          Run the <InlineCode>MIGRATION</InlineCode> constant in Supabase SQL Editor. Adds <InlineCode>avatar_url</InlineCode>,{" "}
          <InlineCode>bio</InlineCode>, <InlineCode>notification_preferences</InlineCode>, and <InlineCode>deleted_at</InlineCode>{" "}
          columns to the existing <InlineCode>profiles</InlineCode> table using <InlineCode>ADD COLUMN IF NOT EXISTS</InlineCode>.
          The Auth block's migration must be run first.
        </p>
        <p>
          Also create the storage bucket in Supabase Dashboard → Storage → New bucket → name it <InlineCode>avatars</InlineCode>.
          Set visibility to <strong style={{ color: "hsl(var(--metal-foreground))" }}>Public</strong> for direct URL access,
          or Private if you want signed URLs.
        </p>
      </Section>

      <Section title="6. Wire it in">
        <CodeBlock filename="app/api/profile/route.ts" code={`import { updateProfile, uploadAvatar } from '@/lib/profile'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const body = await req.json()
  const updated = await updateProfile(session.user.id, body)
  return NextResponse.json(updated)
}

// Avatar upload — accepts multipart/form-data
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const form = await req.formData()
  const file = form.get('avatar') as File
  const { avatarUrl } = await uploadAvatar(session.user.id, file)
  return NextResponse.json({ avatarUrl })
}`} />
      </Section>

      <Section title="7. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Call <InlineCode>updateProfile(userId, &#123; bio: 'hello' &#125;)</InlineCode> and confirm the row updates in the <InlineCode>profiles</InlineCode> table.</li>
          <li>Upload a test image via <InlineCode>uploadAvatar()</InlineCode> and confirm the file appears in Supabase Storage.</li>
          <li>Call <InlineCode>softDeleteAccount(userId)</InlineCode> and confirm <InlineCode>deleted_at</InlineCode> is set on the profile row.</li>
        </ol>
      </Section>

      <Section title="8. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "column 'bio' does not exist", cause: "The profile migration hasn't been run, or ran before the Auth migration created the profiles table.", fix: "Run the Auth block migration first, then the Profile migration." },
            { error: "Bucket not found", cause: "The avatars storage bucket doesn't exist.", fix: "Create it in Supabase Dashboard → Storage → New bucket." },
            { error: "new row violates row-level security policy", cause: "Using the anon key to write profile data directly.", fix: "All writes should go through the service role key on the server. Never call updateProfile() client-side." },
          ].map(({ error, cause, fix }) => (
            <div key={error} className="space-y-1 pb-4 border-b last:border-b-0" style={{ borderColor: "hsl(var(--metal-border))" }}>
              <p className="font-mono text-[11px]" style={{ color: "hsl(var(--status-error))" }}>{error}</p>
              <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Cause:</strong> {cause}</p>
              <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Fix:</strong> {fix}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
