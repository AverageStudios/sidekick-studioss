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

  const resend = new Resend(env.resendApiKey!);

  await resend.emails.send({
    from: env.resendFromEmail!,
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

export async function sendWorkspaceInvitationEmail(input: {
  to: string;
  workspaceName: string;
  inviterName?: string;
  role: "admin" | "member";
  inviteUrl: string;
}) {
  if (!isResendConfigured()) {
    return { skipped: true };
  }

  const resend = new Resend(env.resendApiKey!);
  const inviter = input.inviterName || "A workspace admin";
  const roleLabel = input.role === "admin" ? "Admin" : "Member";

  await resend.emails.send({
    from: env.resendFromEmail!,
    to: input.to,
    subject: `You're invited to join ${input.workspaceName} on SideKick`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.55">
      <h2 style="margin:0 0 12px">Workspace invitation</h2>
      <p style="margin:0 0 10px">${inviter} invited you to join <strong>${input.workspaceName}</strong> as <strong>${roleLabel}</strong>.</p>
      <p style="margin:0 0 14px">Accept the invite from this link:</p>
      <p style="margin:0 0 16px"><a href="${input.inviteUrl}" style="color:#5b3df5">${input.inviteUrl}</a></p>
      <p style="margin:0;color:#555">If you don't have an account yet, sign up with this same email first, then open the invite link again.</p>
    </div>`,
  });

  return { skipped: false };
}

export async function sendCrmIntegrationRequestEmail(input: {
  crmName: string;
  message?: string | null;
  userEmail: string;
  workspaceName?: string | null;
  workspaceId?: string | null;
  submittedAtIso: string;
}) {
  if (!isResendConfigured()) {
    return { skipped: true };
  }

  const resend = new Resend(env.resendApiKey!);

  await resend.emails.send({
    from: env.resendFromEmail!,
    to: "contact@sidekickstudioss.net",
    subject: "New CRM request from SideKick",
    text: [
      `Requested CRM: ${input.crmName}`,
      `Message/use case: ${input.message?.trim() || "No message provided."}`,
      `User email: ${input.userEmail}`,
      `Workspace: ${input.workspaceName || "Unknown workspace"} (${input.workspaceId || "no-workspace"})`,
      `Submitted at: ${input.submittedAtIso}`,
    ].join("\n"),
  });

  return { skipped: false };
}

export async function sendDoneForYouRequestEmail(input: {
  name?: string | null;
  email: string;
  phone?: string | null;
  businessName?: string | null;
  businessUrl?: string | null;
  serviceArea?: string | null;
  monthlyJobs?: string | null;
  message?: string | null;
  submittedAtIso: string;
  requestId?: string | null;
}) {
  if (!isResendConfigured()) {
    return { skipped: true };
  }

  const resend = new Resend(env.resendApiKey!);
  const businessName = input.businessName?.trim() || "Unknown business";

  await resend.emails.send({
    from: env.resendFromEmail!,
    to: env.doneForYouNotifyEmail,
    subject: `New Done-For-You request — ${businessName}`,
    text: [
      `Name: ${input.name?.trim() || "Not provided"}`,
      `Email: ${input.email}`,
      `Phone: ${input.phone?.trim() || "Not provided"}`,
      `Business name: ${businessName}`,
      `Website/social: ${input.businessUrl?.trim() || "Not provided"}`,
      `Service area: ${input.serviceArea?.trim() || "Not provided"}`,
      `Current monthly details/jobs: ${input.monthlyJobs?.trim() || "Not provided"}`,
      `Message: ${input.message?.trim() || "No message provided."}`,
      `Submitted at: ${input.submittedAtIso}`,
      `Request ID: ${input.requestId || "Unavailable"}`,
    ].join("\n"),
  });

  return { skipped: false };
}
