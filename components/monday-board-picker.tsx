"use client";

import { useMemo, useState, useTransition } from "react";
import { listMondayBoardsAction, saveMondayBoardIdAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MondayBoardOption = {
  id: string;
  name: string;
  workspaceName?: string | null;
};

type MondayBoardPickerProps = {
  workspaceId: string;
  selectedBoardId: string;
  selectedBoardName?: string | null;
  selectedBoardWorkspaceName?: string | null;
  canManage: boolean;
};

function formatBoardLabel(board: MondayBoardOption) {
  return board.workspaceName ? `${board.name} • ${board.workspaceName} • ${board.id}` : `${board.name} • ${board.id}`;
}

export function MondayBoardPicker({
  workspaceId,
  selectedBoardId,
  selectedBoardName,
  selectedBoardWorkspaceName,
  canManage,
}: MondayBoardPickerProps) {
  const [boards, setBoards] = useState<MondayBoardOption[]>(
    selectedBoardId && selectedBoardName
      ? [
          {
            id: selectedBoardId,
            name: selectedBoardName,
            workspaceName: selectedBoardWorkspaceName || null,
          },
        ]
      : [],
  );
  const [selectedPickerBoardId, setSelectedPickerBoardId] = useState(selectedBoardId);
  const [manualBoardId, setManualBoardId] = useState(selectedBoardId);
  const [manualOverride, setManualOverride] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isLoadingBoards, startLoadingBoards] = useTransition();

  const normalizedBoards = useMemo(() => {
    const seen = new Set<string>();
    return boards.filter((board) => {
      if (!board.id || seen.has(board.id)) return false;
      seen.add(board.id);
      return true;
    });
  }, [boards]);

  const effectiveBoardId = manualOverride ? manualBoardId : selectedPickerBoardId || manualBoardId;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!canManage || isLoadingBoards}
          onClick={() => {
            startLoadingBoards(async () => {
              const result = await listMondayBoardsAction(workspaceId);
              if (result.ok) {
                setBoards(result.boards);
                setLoadError(null);
                setLoaded(true);
                if (!selectedPickerBoardId && result.boards[0]?.id) {
                  setSelectedPickerBoardId(result.boards[0].id);
                }
              } else {
                setLoadError(result.error || "Could not load monday boards. Paste a board ID manually.");
                setLoaded(true);
              }
            });
          }}
        >
          {isLoadingBoards ? "Loading Boards..." : "Load Boards"}
        </Button>
      </div>

      {normalizedBoards.length ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--ink)]" htmlFor="mondayBoardPicker">
            Monday board
          </label>
          <select
            id="mondayBoardPicker"
            value={selectedPickerBoardId}
            onChange={(event) => {
              setSelectedPickerBoardId(event.target.value);
              setManualOverride(false);
            }}
            className="h-12 w-full rounded-[20px] border border-[var(--line)] bg-white/92 px-[1.125rem] text-sm text-[var(--ink)] shadow-[var(--shadow-soft)] outline-none transition-all duration-200 hover:border-[color-mix(in_oklab,var(--brand)_14%,white)] focus:border-[color-mix(in_oklab,var(--brand)_34%,white)] focus:bg-white focus:ring-2 focus:ring-[var(--soft-brand)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
          >
            <option value="">Choose a monday board</option>
            {normalizedBoards.map((board) => (
              <option key={board.id} value={board.id}>
                {formatBoardLabel(board)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {loadError ? (
        <p className="text-xs text-[var(--muted)]">{loadError}</p>
      ) : !normalizedBoards.length && loaded ? (
        <p className="text-xs text-[var(--muted)]">Could not load monday boards. You can paste a board ID manually.</p>
      ) : null}

      <form action={saveMondayBoardIdAction} className="grid gap-3 sm:grid-cols-[minmax(0,18rem)_auto] sm:items-end">
        <input type="hidden" name="redirectTo" value="/workspace/settings?section=integrations" />
        <input type="hidden" name="boardId" value={effectiveBoardId} />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--ink)]" htmlFor="mondayBoardIdManual">
            Paste board ID manually
          </label>
          <Input
            id="mondayBoardIdManual"
            value={manualBoardId}
            onChange={(event) => {
              setManualBoardId(event.target.value);
              setManualOverride(true);
            }}
            placeholder="Paste a monday board ID manually"
            inputMode="numeric"
          />
        </div>
        <Button type="submit" variant="outline" className="sm:self-end" disabled={!canManage || !effectiveBoardId}>
          Save Board
        </Button>
      </form>

      {selectedBoardName ? (
        <p className="text-xs text-[var(--muted)]">
          Selected board: {selectedBoardName}
          {selectedBoardId ? ` • ${selectedBoardId}` : ""}
        </p>
      ) : effectiveBoardId ? (
        <p className="text-xs text-[var(--muted)]">Choose a monday board before sending a test lead.</p>
      ) : (
        <p className="text-xs text-[var(--muted)]">Choose a monday board before sending a test lead.</p>
      )}
    </div>
  );
}
