import React from "react"
import type { Metadata } from "next"
import { CodeBlock, InlineCode } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Form Validation — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Form Validation block: React Hook Form, Zod, server-side validation, multi-step forms.",
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

export default function FormsDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Content · Starter
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Form Validation</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Typed form primitives and three pre-built forms for Next.js 14+ — built on React Hook Form and Zod,
          with server-side validation via Server Actions and a multi-step form hook.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/forms" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Form Validation block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/forms.ts</InlineCode> (and the pre-built form components) into your project.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>TypeScript 5+ with strict mode</li>
          <li>Tailwind CSS (the pre-built form components use Tailwind classes)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Copy the block files into your project.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install react-hook-form zod @hookform/resolvers`} />
      </Section>

      <Section title="4. Wire it in">
        <p>Use <InlineCode>useZodForm()</InlineCode> to get a fully-typed React Hook Form instance wired to a Zod schema:</p>
        <CodeBlock filename="Custom form with useZodForm" code={`'use client'
import { useZodForm, FormField, FormError } from '@/lib/forms'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10),
})

export function ContactForm() {
  const { register, handleSubmit, formState: { errors } } = useZodForm(schema)

  const onSubmit = handleSubmit(async (data) => {
    await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  })

  return (
    <form onSubmit={onSubmit}>
      <FormField label="Email" error={errors.email?.message}>
        <input {...register('email')} type="email" />
      </FormField>
      <FormField label="Message" error={errors.message?.message}>
        <textarea {...register('message')} />
      </FormField>
      <button type="submit">Send</button>
    </form>
  )
}`} />

        <p>Or drop in one of the three pre-built forms directly:</p>
        <CodeBlock filename="Pre-built forms" code={`import { ContactForm, LoginForm, NewsletterForm } from '@/lib/forms'

// Each form calls a Server Action for server-side validation.
// Wire the action prop to your own handler.
export default function Page() {
  return <ContactForm action={submitContactForm} />
}`} />

        <p>For multi-step flows, use the <InlineCode>useMultiStepForm()</InlineCode> hook:</p>
        <CodeBlock filename="Multi-step form" code={`'use client'
import { useMultiStepForm } from '@/lib/forms'

const steps = [StepOne, StepTwo, StepThree]

export function OnboardingFlow() {
  const { step, next, back, isFirst, isLast } = useMultiStepForm(steps.length)
  const CurrentStep = steps[step]

  return (
    <div>
      <CurrentStep />
      <div>
        {!isFirst && <button onClick={back}>Back</button>}
        {!isLast && <button onClick={next}>Next</button>}
      </div>
    </div>
  )
}`} />
      </Section>

      <Section title="5. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Render a pre-built form and submit with invalid data — confirm Zod validation errors appear inline.</li>
          <li>Submit with valid data — confirm the Server Action is called and returns without errors.</li>
          <li>Test the multi-step hook by stepping through and confirm the step counter increments and decrements correctly.</li>
        </ol>
      </Section>

      <Section title="6. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "Type error on useZodForm — schema type mismatch", cause: "Zod version mismatch between the block and @hookform/resolvers.", fix: "Ensure both use zod@3.x. Run npm ls zod to check for version conflicts." },
            { error: "Server Action not called on submit", cause: "The form is missing the action prop, or the component is used outside a Next.js App Router page.", fix: "Pass your Server Action to the action prop. Server Actions require App Router." },
            { error: "FormField styles not applying", cause: "Tailwind is not scanning the block file for class names.", fix: "Add the block file path to your tailwind.config.ts content array." },
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
