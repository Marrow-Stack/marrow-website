import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode, Section } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "File Upload — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack File Upload block: Supabase Storage, signed URLs, drag-and-drop, image previews.",
}

export default function FileUploadDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Utility · Starter
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">File Upload</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Drag-and-drop file uploader — Supabase Storage with signed URLs, type and size validation,
          simulated progress bar, image previews, multi-file support, and a file-list component.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/fileupload" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>File Upload block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/fileupload.ts</InlineCode> (and the React components) into your project.
        </p>
        <p>
          Before first use, create a storage bucket in Supabase Dashboard → Storage → New bucket.
          Set it to <strong style={{ color: "hsl(var(--metal-foreground))" }}>Private</strong> — the block uses
          signed URLs for all access rather than public bucket URLs.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>Supabase project with a Storage bucket created</li>
          <li>Tailwind CSS (the drop zone component uses Tailwind)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Copy the block files into your project.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install @supabase/supabase-js zod`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_SUPABASE_URL",      required: true,  desc: "Your Supabase project URL" },
          { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true,  desc: "Anon key — used client-side to upload files" },
          { name: "SUPABASE_SERVICE_ROLE_KEY",     required: true,  desc: "Service role key — used server-side to generate signed URLs" },
          { name: "UPLOAD_BUCKET",                 required: false, desc: "Storage bucket name. Defaults to uploads" },
          { name: "MAX_FILE_SIZE_MB",              required: false, desc: "Max file size in MB. Defaults to 10" },
          { name: "ALLOWED_FILE_TYPES",            required: false, desc: "Comma-separated MIME types. Defaults to image/*, application/pdf" },
        ]} />
      </Section>

      <Section title="5. Wire it in">
        <CodeBlock filename="app/api/upload/signed-url/route.ts" code={`import { getSignedUploadUrl } from '@/lib/fileupload'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { filename, contentType } = await req.json()
  const { signedUrl, path } = await getSignedUploadUrl({
    userId: session.user.id,
    filename,
    contentType,
  })

  return NextResponse.json({ signedUrl, path })
}`} />

        <CodeBlock filename="Client — drop zone component" code={`'use client'
import { FileUploadZone, FileList } from '@/lib/fileupload'

export function AttachmentsSection() {
  return (
    <div>
      <FileUploadZone
        onUploaded={(files) => console.log('Uploaded:', files)}
        maxFiles={5}
        accept="image/*,application/pdf"
      />
      <FileList files={uploadedFiles} onDelete={handleDelete} />
    </div>
  )
}`} />
      </Section>

      <Section title="6. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Drop a file onto the <InlineCode>FileUploadZone</InlineCode> and confirm the progress bar fills.</li>
          <li>After upload, open Supabase Dashboard → Storage → your bucket and confirm the file appears.</li>
          <li>Call <InlineCode>getSignedUrl(path)</InlineCode> server-side and confirm you can download the file via the returned URL.</li>
          <li>Attempt to upload a file larger than <InlineCode>MAX_FILE_SIZE_MB</InlineCode> and confirm the client-side error message appears.</li>
        </ol>
      </Section>

      <Section title="7. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "Bucket not found", cause: "The storage bucket named in UPLOAD_BUCKET does not exist.", fix: "Create it in Supabase Dashboard → Storage → New bucket. Name must match exactly." },
            { error: "Invalid signature for signed URL", cause: "The signed URL was used after its expiry (default: 60 seconds for upload, 3600 for download).", fix: "Generate a fresh signed URL for each upload attempt. Don't cache upload URLs." },
            { error: "File type rejected", cause: "The uploaded file's MIME type is not in ALLOWED_FILE_TYPES.", fix: "Add the MIME type to ALLOWED_FILE_TYPES, or update the Zod schema in fileupload.ts." },
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
