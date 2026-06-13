"use client";

import { useState } from "react";
import { deleteWorkspaceAction } from "@/app/actions";
import { ConfirmationModal } from "@/components/account-management-actions";
import { Button } from "@/components/ui/button";

export function WorkspaceDeleteButton({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <form action={deleteWorkspaceAction}>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="redirectTo" value="/workspaces" />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800"
        onClick={() => setOpen(true)}
      >
        Delete
      </Button>
      <ConfirmationModal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Workspace"
        title={`Delete "${workspaceName}"?`}
        description="This permanently removes the workspace and its related campaigns, lead routing data, connected integrations, and Meta connections."
        note="This cannot be undone. Confirm only if you are sure this workspace should be fully removed."
        tone="danger"
        cancelLabel="Keep workspace"
        submitLabel="Yes, delete workspace"
        pendingLabel="Deleting workspace..."
      />
    </form>
  );
}
