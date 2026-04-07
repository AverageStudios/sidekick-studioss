import { Resend } from "resend";
import { env, isResendConfigured } from "@/lib/env";

export async function sendLeadConfirmationEmail(input: {
  to: string;
  businessName: string;
  subject?: string;
  message?: string;
}) {
  if (!isResendConfigured()) {
    return { skipped: true };
  }

  const resend = new Resend(env.resendApiKey);

  await resend.emails.send({
    from: env.resendFromEmail,
    to: input.to,
    subject: input.subject || `Thanks for reaching out to ${input.businessName}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 12px">We got your request</h2>
      <p style="margin:0 0 10px">Thanks for reaching out to ${input.businessName}. We’ll follow up shortly.</p>
      <p style="margin:0;color:#555">${input.message || "You can reply to this email if there is anything else we should know."}</p>
    </div>`,
  });

  return { skipped: false };
}

