"use client";

import { useState, useTransition } from "react";
import { requestCrmIntegrationAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function RequestCrmCard({
  userEmail,
  workspaceName,
}: {
  userEmail?: string | null;
  workspaceName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [crmName, setCrmName] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setCrmName("");
    setMessage("");
    setFieldError(null);
  }

  return (
    <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-[var(--ink)]">Don&apos;t see your CRM?</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Request a CRM integration and we&apos;ll use it to prioritize what we build next.
          </p>
        </div>
        {!open ? (
          <Button type="button" onClick={() => setOpen(true)}>
            Request a CRM
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="mt-5 rounded-[1.35rem] border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--ink)]" htmlFor="crmRequestName">
                CRM name
              </label>
              <Input
                id="crmRequestName"
                value={crmName}
                onChange={(event) => {
                  setCrmName(event.target.value);
                  if (fieldError) setFieldError(null);
                }}
                placeholder="Example: Copper, Close, or ActiveCampaign"
                aria-invalid={fieldError ? "true" : "false"}
              />
              {fieldError ? <p className="text-xs text-rose-600">{fieldError}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--ink)]" htmlFor="crmRequestMessage">
                Message or use case
              </label>
              <Textarea
                id="crmRequestMessage"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell us how you want to use this CRM with SideKick."
              />
            </div>

            {userEmail ? (
              <div className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-xs text-[var(--muted)]">
                Requesting as {userEmail}
                {workspaceName ? ` for ${workspaceName}` : ""}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setFeedback(null);
                  startTransition(async () => {
                    const result = await requestCrmIntegrationAction({
                      crmName,
                      message,
                    });

                    if (!result.ok) {
                      setFieldError(result.fieldError || null);
                      setFeedback({ type: "error", text: result.error || "Could not send request. Please try again." });
                      return;
                    }

                    resetForm();
                    setOpen(false);
                    setFeedback({ type: "success", text: result.message || "CRM request sent." });
                  });
                }}
              >
                {isPending ? "Sending..." : "Submit request"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <p className={`mt-4 text-sm ${feedback.type === "success" ? "text-emerald-700" : "text-rose-700"}`}>
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
