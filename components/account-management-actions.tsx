"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { CreditCard, Trash2 } from "lucide-react";
import { cancelSubscriptionAction, deleteAccountAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

function ActionSubmitButton({
  label,
  pendingLabel,
  className,
  icon,
}: {
  label: string;
  pendingLabel: string;
  className: string;
  icon: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" size="sm" className={className} disabled={pending}>
      {icon}
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function CancelSubscriptionButton({
  hasActiveBilling = false,
}: {
  hasActiveBilling?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmMessage = hasActiveBilling
    ? "Are you sure you want to cancel your subscription? This will send a cancellation request for your active trial or subscription."
    : "Are you sure you want to cancel your subscription? If billing is active on this account, we’ll send a cancellation request right away.";

  return (
    <form ref={formRef} action={cancelSubscriptionAction}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-900"
        onClick={() => {
          if (window.confirm(confirmMessage)) {
            formRef.current?.requestSubmit();
          }
        }}
      >
        <CreditCard className="h-4 w-4" />
        Cancel subscription
      </Button>
      <div className="hidden">
        <ActionSubmitButton
          label="Cancel subscription"
          pendingLabel="Submitting request..."
          className="border-amber-200 bg-amber-50 text-amber-800"
          icon={<CreditCard className="h-4 w-4" />}
        />
      </div>
    </form>
  );
}

export function DeleteAccountButton({
  hasActiveBilling = false,
}: {
  hasActiveBilling?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmMessage = hasActiveBilling
    ? "Delete your account? This will permanently remove your SideKick account, your workspaces, campaigns, leads, and connected accounts. Your active trial or subscription should be canceled first."
    : "Delete your account? This will permanently remove your SideKick account, your workspaces, campaigns, leads, support history, and connected accounts. If billing is active on this account in the future, it should be canceled before deletion.";

  return (
    <form ref={formRef} action={deleteAccountAction}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800"
        onClick={() => {
          if (window.confirm(confirmMessage)) {
            formRef.current?.requestSubmit();
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
        Delete account
      </Button>
      <div className="hidden">
        <ActionSubmitButton
          label="Delete account"
          pendingLabel="Deleting account..."
          className="border-rose-200 bg-rose-50 text-rose-700"
          icon={<Trash2 className="h-4 w-4" />}
        />
      </div>
    </form>
  );
}
