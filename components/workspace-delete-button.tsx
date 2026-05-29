"use client";

import { useRef } from "react";
import { deleteWorkspaceAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function WorkspaceDeleteButton({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={deleteWorkspaceAction}>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="redirectTo" value="/workspaces" />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800"
        onClick={() => {
          const confirmed = window.confirm(
            `Delete "${workspaceName}"? This will permanently remove the workspace and its related campaigns, leads, and Meta connections.`,
          );
          if (confirmed) {
            formRef.current?.requestSubmit();
          }
        }}
      >
        Delete
      </Button>
    </form>
  );
}
