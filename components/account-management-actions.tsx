"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { AlertTriangle, CreditCard, Trash2, X } from "lucide-react";
import { cancelSubscriptionAction, deleteAccountAction } from "@/app/actions";
import { AsyncSubmitButton } from "@/components/ui/async-submit-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ConfirmSubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  return <AsyncSubmitButton label={label} pendingLabel={pendingLabel} className="rounded-[18px] px-5" />;
}

function ConfirmationModal({
  open,
  onClose,
  eyebrow,
  title,
  description,
  note,
  tone = "warning",
  cancelLabel = "Go back",
  submitLabel,
  pendingLabel,
  pendingOverride,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  description: string;
  note?: string;
  tone?: "warning" | "danger";
  cancelLabel?: string;
  submitLabel: string;
  pendingLabel: string;
  pendingOverride?: boolean;
  onSubmit?: () => void;
}) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingOverride ?? formPending;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, pending]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.58)] px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-[32rem] rounded-[2rem] border border-[rgba(255,255,255,0.2)] bg-white p-5 shadow-[0_32px_90px_rgba(15,23,42,0.28)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{eyebrow}</p>
            <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-[var(--line)] p-2 text-[var(--muted-strong)] transition-colors hover:bg-[var(--soft-panel)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-60"
            onClick={onClose}
            disabled={pending}
            aria-label="Close confirmation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className={cn(
            "mt-5 rounded-[1.5rem] border px-4 py-4",
            tone === "danger"
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : "border-amber-200 bg-amber-50 text-amber-900",
          )}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "danger" ? "text-rose-600" : "text-amber-700")}
            />
            <p className="text-sm leading-6">{note || "Please confirm before continuing."}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          {onSubmit ? (
            <Button type="button" onClick={onSubmit} disabled={pending}>
              {pending ? pendingLabel : submitLabel}
            </Button>
          ) : (
            <ConfirmSubmitButton label={submitLabel} pendingLabel={pendingLabel} />
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmActionForm({
  triggerLabel,
  triggerIcon,
  triggerClassName,
  action,
  confirmTitle,
  confirmDescription,
  confirmNote,
  confirmEyebrow,
  confirmTone,
  cancelLabel,
  submitLabel,
  pendingLabel,
}: {
  triggerLabel: string;
  triggerIcon: ReactNode;
  triggerClassName: string;
  action: (formData: FormData) => Promise<void>;
  confirmTitle: string;
  confirmDescription: string;
  confirmNote: string;
  confirmEyebrow: string;
  confirmTone: "warning" | "danger";
  cancelLabel?: string;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <form action={action}>
      <Button type="button" variant="outline" size="sm" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerIcon}
        {triggerLabel}
      </Button>
      <ConfirmationModal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow={confirmEyebrow}
        title={confirmTitle}
        description={confirmDescription}
        note={confirmNote}
        tone={confirmTone}
        cancelLabel={cancelLabel}
        submitLabel={submitLabel}
        pendingLabel={pendingLabel}
      />
    </form>
  );
}

export function CancelSubscriptionButton({
  hasActiveBilling = false,
}: {
  hasActiveBilling?: boolean;
}) {
  return (
    <ConfirmActionForm
      triggerLabel="Cancel subscription"
      triggerIcon={<CreditCard className="h-4 w-4" />}
      triggerClassName="border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-900"
      action={cancelSubscriptionAction}
      confirmEyebrow="Billing"
      confirmTitle="Cancel subscription?"
      confirmDescription="We’ll submit a billing cancellation request from your account settings so the SideKick team can stop the trial or subscription for this account."
      confirmNote={
        hasActiveBilling
          ? "This should cancel the active trial or subscription tied to this account."
          : "If billing is active on this account in the future, this request will still be the right place to start."
      }
      confirmTone="warning"
      cancelLabel="Go back"
      submitLabel="Yes, cancel subscription"
      pendingLabel="Submitting request..."
    />
  );
}

export function DeleteAccountButton({
  hasActiveBilling = false,
}: {
  hasActiveBilling?: boolean;
}) {
  return (
    <ConfirmActionForm
      triggerLabel="Delete account"
      triggerIcon={<Trash2 className="h-4 w-4" />}
      triggerClassName="border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800"
      action={deleteAccountAction}
      confirmEyebrow="Danger zone"
      confirmTitle="Delete account permanently?"
      confirmDescription="This removes your SideKick profile, owned workspaces, campaigns, leads, support history, and connected accounts. This action cannot be undone."
      confirmNote={
        hasActiveBilling
          ? "Cancel the active trial or subscription first if you do not want billing to continue while the account is being closed."
          : "If billing is added to this account later, subscription cancellation should happen before permanent deletion."
      }
      confirmTone="danger"
      cancelLabel="Keep account"
      submitLabel="Yes, delete account"
      pendingLabel="Deleting account..."
    />
  );
}

export { ConfirmationModal };
