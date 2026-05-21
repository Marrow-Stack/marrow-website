import nodemailer from "nodemailer"

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const FROM = process.env.EMAIL_FROM ?? "noreply@marrowstack.dev"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://marrowstack.dev"

export async function sendDeliveryEmail(params: {
  to: string
  buyerName: string
  blockName: string
  blockSlug: string
  githubUsername: string
  repoUrls: string[]
}) {
  const docsUrl = `${APP_URL}/docs/blocks/${params.blockSlug}`
  const dashboardUrl = `${APP_URL}/dashboard`

  const repoList = params.repoUrls
    .map((r) => `• ${r}`)
    .join("\n")

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
      <h2 style="margin-bottom: 4px;">Your block is ready — ${params.blockName}</h2>
      <p style="color: #475569; margin-top: 4px;">Hi ${params.buyerName || params.githubUsername},</p>
      <p>
        GitHub has sent a repository invitation to
        <strong>@${params.githubUsername}</strong>. Accept it, then clone
        the repo and follow the integration guide below.
      </p>
      <h3>Repositories</h3>
      ${params.repoUrls.map((r) => `<p><a href="https://github.com/${r}" style="color:#6d28d9;">${r}</a></p>`).join("")}
      <h3>Next step</h3>
      <p>
        <a href="${docsUrl}" style="display:inline-block;background:#6d28d9;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          Open integration guide →
        </a>
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
        View all purchases in your <a href="${dashboardUrl}" style="color:#6d28d9;">dashboard</a>.
        Questions? Reply to this email.
      </p>
    </div>
  `

  const text = `
Your block is ready — ${params.blockName}

Hi ${params.buyerName || params.githubUsername},

GitHub has sent an invitation to @${params.githubUsername}. Accept it, then clone and follow the guide.

Repositories:
${repoList}

Integration guide: ${docsUrl}
Dashboard: ${dashboardUrl}
  `.trim()

  if (!process.env.SMTP_HOST) {
    // Email not configured — log instead of crashing
    console.warn("[email] SMTP not configured. Would have sent delivery email to:", params.to)
    return
  }

  const transport = getTransport()
  await transport.sendMail({
    from: FROM,
    to: params.to,
    subject: `Your MarrowStack block is ready: ${params.blockName}`,
    text,
    html,
  })
}
