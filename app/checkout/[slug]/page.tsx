import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getBlock } from "@/lib/blocks-data"
import { RefractiveDock } from "@/components/navbar"
import { CheckoutClient } from "./CheckoutClient"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const block = getBlock(slug)
  return block
    ? { title: `Buy ${block.name} — MarrowStack` }
    : {}
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const block = getBlock(slug)
  if (!block) notFound()

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=/checkout/${slug}`)
  }

  const cryptoDefault = process.env.STORE_CRYPTO_DEFAULT ?? "usdc"

  return (
    <div className="min-h-screen font-display">
      <RefractiveDock />
      <main className="container mx-auto max-w-lg px-4 pt-36 pb-24">
        <CheckoutClient
          block={{
            id:    block.id,
            slug:  block.slug,
            name:  block.name,
            price: block.price,
          }}
          githubLogin={session.user.githubLogin ?? null}
          cryptoDefault={cryptoDefault}
        />
      </main>
    </div>
  )
}
