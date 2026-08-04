import nodemailer from "nodemailer"
import { env, isEmailEnabled } from "./env"

// Plain SMTP, not a provider SDK, so switching provider is an env change.
const transport = isEmailEnabled
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      // 465 is implicit TLS; anything else negotiates STARTTLS.
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    })
  : null

function layout(
  heading: string,
  body: string,
  action: { url: string; label: string },
) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px;background:#f6f7f9;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#111827">
    <table role="presentation" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">
      <tr><td>
        <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3">${heading}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563">${body}</p>
        <a href="${action.url}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;font-weight:600">${action.label}</a>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b7280">
          If the button does not work, paste this into your browser:<br />
          <span style="word-break:break-all">${action.url}</span>
        </p>
      </td></tr>
    </table>
  </body>
</html>`
}

// Throwing would surface as a failed sign-up; another mail can be requested.
async function send(to: string, subject: string, html: string) {
  if (!transport || !env.EMAIL_FROM) {
    console.warn(`Email not configured, skipped "${subject}" to ${to}`)
    return
  }

  try {
    await transport.sendMail({ from: env.EMAIL_FROM, to, subject, html })
  } catch (err) {
    console.error("Failed to send email", err)
  }
}

export async function sendVerificationEmail(to: string, url: string) {
  await send(
    to,
    "Confirm your email",
    layout(
      "Confirm your email",
      "Confirm this address to finish setting up your job tracker account.",
      { url, label: "Confirm email" },
    ),
  )
}

export async function sendPasswordResetEmail(to: string, url: string) {
  await send(
    to,
    "Reset your password",
    layout(
      "Reset your password",
      "Choose a new password using the link below. It expires in an hour. If you did not ask for this, ignore this message and nothing changes.",
      { url, label: "Reset password" },
    ),
  )
}

export async function sendEmailChangeConfirmation(to: string, url: string) {
  await send(
    to,
    "Confirm your new email",
    layout(
      "Confirm the change",
      "Approve this change to move your job tracker account to a new address.",
      { url, label: "Confirm change" },
    ),
  )
}

export { isEmailEnabled }
