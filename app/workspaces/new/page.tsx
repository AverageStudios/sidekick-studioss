import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createWorkspaceAction } from "@/app/actions";
import { AsyncSubmitButton } from "@/components/ui/async-submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireProductAccessUser } from "@/lib/auth";
import { supportedIndustries } from "@/data/template-taxonomy";

export default async function NewWorkspacePage() {
  const user = await requireProductAccessUser("/workspaces/new");

  return (
    <AppShell currentPath="/workspaces">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Create a new workspace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              A separate business with its own campaigns, leads, and Meta connection.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/workspaces">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        <form action={createWorkspaceAction} className="rounded-[28px] border border-[var(--line)] bg-white p-7 shadow-[0_12px_34px_rgba(15,23,42,0.05)] sm:p-8">
          <input type="hidden" name="redirectTo" value="/workspace/settings?section=general&created=1" />

          <div className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--ink)]" htmlFor="workspaceName">
                  <span>Workspace name</span>
                  <span className="rounded-full bg-[var(--soft-panel)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)]">
                    Required
                  </span>
                </label>
                <Input
                  id="workspaceName"
                  name="workspaceName"
                  placeholder="Acme Growth Team"
                  required
                />
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  This is the label you will see in the workspace switcher.
                </p>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--ink)]" htmlFor="businessName">
                  <span>Business name</span>
                  <span className="rounded-full border border-[var(--line)] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Optional
                  </span>
                </label>
                <Input
                  id="businessName"
                  name="businessName"
                  placeholder="Acme Auto Detailing"
                />
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  Used for workspace identity, publishing defaults, and lead attribution. If you leave it blank, we&apos;ll reuse the workspace name.
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--ink)]" htmlFor="businessEmail">
                  <span>Business email</span>
                  <span className="rounded-full border border-[var(--line)] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Optional
                  </span>
                </label>
                <Input
                  id="businessEmail"
                  name="businessEmail"
                  type="email"
                  defaultValue={user.email || ""}
                  placeholder="hello@yourbusiness.com"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--ink)]" htmlFor="businessPhone">
                  <span>Business phone</span>
                  <span className="rounded-full border border-[var(--line)] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Optional
                  </span>
                </label>
                <Input
                  id="businessPhone"
                  name="businessPhone"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--ink)]" htmlFor="website">
                  <span>Website</span>
                  <span className="rounded-full border border-[var(--line)] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Optional
                  </span>
                </label>
                <Input
                  id="website"
                  name="website"
                  placeholder="https://yourbusiness.com"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--ink)]" htmlFor="privacyPolicyUrl">
                  <span>Privacy policy URL</span>
                  <span className="rounded-full border border-[var(--line)] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Optional
                  </span>
                </label>
                <Input
                  id="privacyPolicyUrl"
                  name="privacyPolicyUrl"
                  placeholder="https://yourbusiness.com/privacy"
                />
              </div>
            </div>

            <div className="max-w-sm">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--ink)]" htmlFor="industry">
                <span>Industry</span>
                <span className="rounded-full border border-[var(--line)] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Optional
                </span>
              </label>
              <select
                id="industry"
                name="industry"
                className="h-11 w-full rounded-[14px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                defaultValue=""
              >
                <option value="">Select an industry</option>
                {supportedIndustries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-6">
              <p className="text-sm text-[var(--muted)]">
                You&apos;ll be switched into the new workspace after creating it.
              </p>
              <div className="flex gap-3">
                <Button asChild variant="outline">
                  <Link href="/workspaces">Cancel</Link>
                </Button>
                <AsyncSubmitButton label="Create workspace" pendingLabel="Creating..." />
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
