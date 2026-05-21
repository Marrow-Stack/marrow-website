// Shared report writing utility for verification scripts
import fs from "fs"
import path from "path"

const REPORT_PATH = path.join(process.cwd(), "verification-report.md")

export function appendReport(section: string, lines: string[]) {
  const timestamp = new Date().toISOString()
  const content = [
    `\n## ${section} — ${timestamp}`,
    ...lines.map((l) => `- ${l}`),
    "",
  ].join("\n")

  fs.appendFileSync(REPORT_PATH, content, "utf8")
}

export function initReport() {
  const header = `# MarrowStack Verification Report\n\nGenerated: ${new Date().toISOString()}\n\n---\n`
  if (!fs.existsSync(REPORT_PATH)) {
    fs.writeFileSync(REPORT_PATH, header, "utf8")
  }
}

export function pass(label: string): void {
  console.log(`  ✅ ${label}`)
}

export function fail(label: string, reason?: string): void {
  const msg = reason ? `${label}: ${reason}` : label
  console.error(`  ❌ ${msg}`)
}

export function info(label: string): void {
  console.log(`  ℹ️  ${label}`)
}

export function section(name: string): void {
  console.log(`\n▶ ${name}`)
}
