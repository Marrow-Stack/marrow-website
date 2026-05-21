import { describe, it, expect } from "bun:test"
import nacl from "tweetnacl"
import bs58 from "bs58"

// Inline the pure verification function (mirrors lib/auth.ts verifySolanaSignature)
function verifySolanaSignature(
  message: string,
  signatureB58: string,
  publicKeyB58: string
): boolean {
  try {
    const msgBytes = new TextEncoder().encode(message)
    const sigBytes = bs58.decode(signatureB58)
    const pkBytes  = bs58.decode(publicKeyB58)
    return nacl.sign.detached.verify(msgBytes, sigBytes, pkBytes)
  } catch {
    return false
  }
}

function makeKeypair() {
  return nacl.sign.keyPair()
}

function sign(message: string, secretKey: Uint8Array): string {
  const msgBytes = new TextEncoder().encode(message)
  return bs58.encode(nacl.sign.detached(msgBytes, secretKey))
}

describe("verifySolanaSignature", () => {
  it("accepts a valid signature", () => {
    const kp = makeKeypair()
    const msg = "Sign in to MarrowStack\nNonce: abc123"
    const sig = sign(msg, kp.secretKey)
    const pub = bs58.encode(kp.publicKey)

    expect(verifySolanaSignature(msg, sig, pub)).toBe(true)
  })

  it("rejects a signature from a different keypair", () => {
    const kp1 = makeKeypair()
    const kp2 = makeKeypair()
    const msg = "Sign in to MarrowStack\nNonce: abc123"
    const sig = sign(msg, kp1.secretKey)
    const pub = bs58.encode(kp2.publicKey)

    expect(verifySolanaSignature(msg, sig, pub)).toBe(false)
  })

  it("rejects a signature over a different message", () => {
    const kp = makeKeypair()
    const sig = sign("original message", kp.secretKey)
    const pub = bs58.encode(kp.publicKey)

    expect(verifySolanaSignature("tampered message", sig, pub)).toBe(false)
  })

  it("rejects a truncated signature", () => {
    const kp = makeKeypair()
    const msg = "Sign in\nNonce: x"
    const sig = bs58.encode(nacl.sign.detached(new TextEncoder().encode(msg), kp.secretKey).slice(0, 32))
    const pub = bs58.encode(kp.publicKey)

    expect(verifySolanaSignature(msg, sig, pub)).toBe(false)
  })

  it("rejects empty inputs without throwing", () => {
    expect(verifySolanaSignature("", "", "")).toBe(false)
  })
})
