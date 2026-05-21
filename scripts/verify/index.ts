#!/usr/bin/env bun
// Master verification runner.
// Usage: bun run verify:dev    — runs static + prompts for dev flows
//        bun run verify:prod-readiness — runs production readiness checks only

import { execSync } from "child_process"
import path from "path"
import { section, pass, fail } from "./report"

const SCRIPTS_DIR = path.join(import.meta.dirname)

function runScript(name: string, file: string): boolean {
  section(`Running: ${name}`)
  try {
    execSync(`bun run ${path.join(SCRIPTS_DIR, file)}`, {
      stdio: "inherit",
      env: { ...process.env },
    })
    pass(`${name} — passed`)
    return true
  } catch {
    fail(`${name} — FAILED`)
    return false
  }
}

async function main() {
  const mode = process.argv[2] ?? "dev"

  if (mode === "prod-readiness") {
    section("Production Readiness Verification")
    const ok = runScript("Prod Readiness Checks", "prod-readiness.ts")
    process.exit(ok ? 0 : 1)
    return
  }

  // dev mode: static → dodo → solana
  section("MarrowStack v1.2 — Full Dev Verification Suite")
  console.log("This will run static checks and then walk through payment test flows.")
  console.log("The dev server (bun run dev) must be running before continuing.\n")

  const results = [
    runScript("Static & Build", "static.ts"),
  ]

  if (results.every(Boolean)) {
    console.log("\n✅ Static checks passed. Starting interactive payment flows...")
    results.push(runScript("Dodo Test Flows", "dodo.ts"))
    results.push(runScript("Solana Devnet Flows", "solana.ts"))
  }

  const allPassed = results.every(Boolean)
  const passed = results.filter(Boolean).length

  console.log(`\n${"═".repeat(50)}`)
  console.log(`TOTAL: ${passed}/${results.length} suites passed`)
  console.log(allPassed ? "\n🟢 All verification suites passed." : "\n🔴 Some suites failed — fix before deploying.")

  process.exit(allPassed ? 0 : 1)
}

main()
