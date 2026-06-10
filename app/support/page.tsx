import Link from "next/link";
import { CheckCircle2, LifeBuoy, Mail, MessageSquareText, ShieldCheck } from "lucide-react";
import { submitSupportTicketAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { getCurrentWorkspaceContext } from "@/lib/workspaces";

const supportEmail = "contact@sidekickstudioss.net";

const categories = [
  { value: "campaign_launch", label: "Campaign Launch" },
  { value: "meta_connection", label: "Meta Connection" },
  { value: "crm_integration", label: "CRM Integration" },
  { value: "billing", label: "Billing" },
  { value: "bug_report", label: "Bug Report" },
  { value: "general_question", label: "General Question" },
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string; from?: string }>;
}) {
  const user = await requireUser();
  const [{ submitted, error, from }, workspaceContext] = await Promise.all([
    searchParams,
    getCurrentWorkspaceContext(),
  ]);
  const workspaceName = workspaceContext?.activeWorkspace.name || "Current workspace";
  const workspaceId = workspaceContext?.activeWorkspace.id || "";
  const userName = workspaceContext?.userDisplayName || user.email || "SideKick user";
  const mailtoSubject = encodeURIComponent(`SideKick support request - ${workspaceName}`);
  const mailtoBody = encodeURIComponent(
    [
      "Hi SideKick Support,",
      "",
      "I need help with:",
      "",
      `Workspace: ${workspaceName}${workspaceId ? ` (${workspaceId})` : ""}`,
      `Account: ${user.email || workspaceContext?.userEmail || ""}`,
      from ? `Page: ${from}` : "Page: /support",
    ].join("\n"),
  );
  const emailHref = `mailto:${supportEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <AppShell currentPath="/support">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Support</p>
            <h1 className="mt-1 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">Help & Support</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Get help from the SideKick team with campaign launch, Meta connections, CRM handoff, billing, bugs, or general questions.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={emailHref}>
              <Mail className="h-4 w-4" />
              Email Support
            </Link>
          </Button>
        </div>

        {submitted ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Your ticket was received.</p>
                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  The SideKick team has the workspace context and your message. We will follow up by email.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-2">
          <a
            href="#ticket"
            className="group rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.07)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--soft-panel)] text-[var(--brand)]">
              <MessageSquareText className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Submit a Support Ticket</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Send details directly from the app so support can see the workspace and page context.
            </p>
          </a>

          <Link
            href={emailHref}
            className="group rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.07)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--soft-panel)] text-[var(--brand)]">
              <Mail className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Email Support</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Open your email client with the workspace details already included.
            </p>
          </Link>
        </section>

        <section id="ticket" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Ticket</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">What can we help with?</h2>
            </div>

            <form action={submitSupportTicketAction} className="space-y-4">
              <input type="hidden" name="currentRoute" value={from || "/support"} />
              <div>
                <label htmlFor="subject" className="text-sm font-medium text-[var(--ink)]">
                  Subject
                </label>
                <Input id="subject" name="subject" className="mt-2" placeholder="Short summary" required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className="text-sm font-medium text-[var(--ink)]">
                    Category
                  </label>
                  <Select id="category" name="category" className="mt-2" defaultValue="general_question" required>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label htmlFor="priority" className="text-sm font-medium text-[var(--ink)]">
                    Priority
                  </label>
                  <Select id="priority" name="priority" className="mt-2" defaultValue="medium" required>
                    {priorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="text-sm font-medium text-[var(--ink)]">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  className="mt-2 min-h-[170px]"
                  placeholder="Share what happened, what you were trying to do, and anything urgent we should know."
                  required
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-[var(--muted)]">
                  Sending as {userName} from {workspaceName}.
                </p>
                <Button type="submit">
                  <LifeBuoy className="h-4 w-4" />
                  Submit Ticket
                </Button>
              </div>
            </form>
          </div>

          <aside className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--soft-panel)] p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white text-[var(--brand)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-base font-semibold text-[var(--ink)]">Included with your ticket</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
              <p>Workspace name and ID</p>
              <p>Your account name and email</p>
              <p>The app page you came from</p>
              <p>Submission time and app environment</p>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
