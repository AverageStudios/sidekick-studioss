"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { listMondayBoardsAction, updateMondayBoardSelectionAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type MondayBoardOption = {
  id: string;
  name: string;
  workspaceName?: string | null;
  kind?: string | null;
};

type MondayBoardPickerProps = {
  workspaceId: string;
  selectedBoardId: string;
  selectedBoardName?: string | null;
  selectedBoardWorkspaceName?: string | null;
  canManage: boolean;
};

function normalizeBoardName(name: string) {
  return name.trim().toLowerCase();
}

function isSubitemBoard(board: MondayBoardOption) {
  const name = normalizeBoardName(board.name);
  const kind = (board.kind || "").trim().toLowerCase();
  return name.startsWith("subitems of") || kind.includes("subitem") || kind.includes("internal");
}

function getBoardPriority(board: MondayBoardOption) {
  const name = normalizeBoardName(board.name);
  if (name === "leads" || name.startsWith("leads ")) return 0;
  if (name === "deals" || name.startsWith("deals ")) return 1;
  if (name === "contacts" || name.startsWith("contacts ")) return 2;
  if (name === "accounts" || name.startsWith("accounts ")) return 3;
  return 10;
}

function formatBoardLabel(board: MondayBoardOption) {
  return board.workspaceName ? `${board.name} - ${board.workspaceName}` : board.name;
}

function getRecommendedBoardId(boards: MondayBoardOption[]) {
  const leadsBoard = boards.find((board) => getBoardPriority(board) === 0);
  return leadsBoard?.id || boards[0]?.id || "";
}

export function MondayBoardPicker({
  workspaceId,
  selectedBoardId,
  selectedBoardName,
  selectedBoardWorkspaceName,
  canManage,
}: MondayBoardPickerProps) {
  const [savedBoardId, setSavedBoardId] = useState(selectedBoardId);
  const [savedBoardName, setSavedBoardName] = useState(selectedBoardName || "");
  const [savedBoardWorkspaceName, setSavedBoardWorkspaceName] = useState(selectedBoardWorkspaceName || "");
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
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isLoadingBoards, startLoadingBoards] = useTransition();
  const [isSavingBoard, startSavingBoard] = useTransition();

  const normalizedBoards = useMemo(() => {
    const seen = new Set<string>();
    return boards
      .filter((board) => {
        if (!board.id || seen.has(board.id)) return false;
        if (isSubitemBoard(board)) return false;
        seen.add(board.id);
        return true;
      })
      .sort((left, right) => {
        const priorityDiff = getBoardPriority(left) - getBoardPriority(right);
        if (priorityDiff !== 0) return priorityDiff;
        return left.name.localeCompare(right.name);
      });
  }, [boards]);

  const recommendedBoardId = useMemo(
    () => (savedBoardId ? savedBoardId : getRecommendedBoardId(normalizedBoards)),
    [normalizedBoards, savedBoardId],
  );

  const selectedBoardRecord = normalizedBoards.find((board) => board.id === selectedPickerBoardId) || null;

  const effectiveBoardId = manualOverride ? manualBoardId : selectedPickerBoardId || manualBoardId;

  useEffect(() => {
    if (!canManage || loaded || isLoadingBoards) return;

    startLoadingBoards(async () => {
      const result = await listMondayBoardsAction(workspaceId);
      if (result.ok) {
        setBoards(result.boards);
        setLoadError(null);
        setLoaded(true);
        if (!selectedBoardId) {
          const recommendedId = getRecommendedBoardId(
            result.boards.filter((board) => !isSubitemBoard(board)).sort((left, right) => {
              const priorityDiff = getBoardPriority(left) - getBoardPriority(right);
              if (priorityDiff !== 0) return priorityDiff;
              return left.name.localeCompare(right.name);
            }),
          );
          if (recommendedId) {
            setSelectedPickerBoardId(recommendedId);
          }
        } else if (!selectedPickerBoardId) {
          setSelectedPickerBoardId(selectedBoardId);
        }
      } else {
        setLoadError(result.error || "Could not load monday boards. Paste a board ID manually.");
        setLoaded(true);
      }
    });
  }, [canManage, isLoadingBoards, loaded, savedBoardId, selectedBoardId, selectedPickerBoardId, workspaceId]);

  function saveBoardSelection(boardId: string) {
    if (!canManage || !boardId) return;

    startSavingBoard(async () => {
      const result = await updateMondayBoardSelectionAction({
        workspaceId,
        boardId,
      });

      if (!result.ok) {
        setLoadError(result.error || "Monday board could not be saved right now.");
        setSaveMessage(null);
        return;
      }

      if (!result.board) {
        setLoadError("Monday board could not be saved right now.");
        setSaveMessage(null);
        return;
      }

      setLoadError(null);
      setSaveMessage(result.message || "Monday board saved.");
      setSavedBoardId(result.board.id);
      setSavedBoardName(result.board.name);
      setSavedBoardWorkspaceName(result.board.workspaceName || "");
      setManualBoardId(result.board.id);
      setManualOverride(false);
      setSelectedPickerBoardId(result.board.id);
    });
  }

  return (
    <div className="mt-4 space-y-4">
      {isLoadingBoards ? (
        <p className="text-xs text-[var(--muted)]">Loading monday boards...</p>
      ) : null}
      {isSavingBoard ? (
        <p className="text-xs text-[var(--muted)]">Saving monday board...</p>
      ) : null}

      {normalizedBoards.length ? (
        <div className="space-y-2">
          <p className="text-xs text-[var(--muted)]">
            Choose the monday board where new SideKick leads should be created. We recommend the Leads board.
          </p>
          <label className="block text-sm font-medium text-[var(--ink)]" htmlFor="mondayBoardPicker">
            Monday board
          </label>
          <select
            id="mondayBoardPicker"
            value={selectedPickerBoardId || recommendedBoardId}
            onChange={(event) => {
              const nextBoardId = event.target.value;
              setSelectedPickerBoardId(nextBoardId);
              setManualOverride(false);
              setSaveMessage(null);
              if (nextBoardId) {
                saveBoardSelection(nextBoardId);
              }
            }}
            className="h-12 w-full rounded-[20px] border border-[var(--line)] bg-white/92 px-[1.125rem] text-sm text-[var(--ink)] shadow-[var(--shadow-soft)] outline-none transition-all duration-200 hover:border-[color-mix(in_oklab,var(--brand)_14%,white)] focus:border-[color-mix(in_oklab,var(--brand)_34%,white)] focus:bg-white focus:ring-2 focus:ring-[var(--soft-brand)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
            disabled={!canManage || isSavingBoard}
          >
            <option value="">Choose a monday board</option>
            {normalizedBoards.map((board) => (
              <option key={board.id} value={board.id}>
                {formatBoardLabel(board)}
              </option>
            ))}
          </select>
          {selectedBoardRecord ? (
            <p className="text-xs text-[var(--muted)]">Board ID: {selectedBoardRecord.id}</p>
          ) : recommendedBoardId ? (
            <p className="text-xs text-[var(--muted)]">Board ID: {recommendedBoardId}</p>
          ) : null}
        </div>
      ) : null}

      {loadError ? (
        <p className="text-xs text-[var(--muted)]">{loadError}</p>
      ) : !normalizedBoards.length && loaded ? (
        <p className="text-xs text-[var(--muted)]">Could not load monday boards. You can paste a board ID manually.</p>
      ) : null}

      <details className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
        <summary className="cursor-pointer text-sm font-medium text-[var(--ink)]">
          Advanced
        </summary>
        <div className="mt-3 space-y-3">
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
                setSaveMessage(null);
              }}
              placeholder="Paste a monday board ID manually"
              inputMode="numeric"
              disabled={!canManage || isSavingBoard}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!canManage || !manualBoardId || isSavingBoard}
              onClick={() => saveBoardSelection(manualBoardId)}
            >
              Use Pasted Board ID
            </Button>
          </div>
        </div>
      </details>

      {saveMessage ? (
        <p className="text-xs text-emerald-700">{saveMessage}</p>
      ) : null}

      {savedBoardName ? (
        <p className="text-xs text-[var(--muted)]">
          Selected board: {savedBoardName}
          {savedBoardWorkspaceName ? ` - ${savedBoardWorkspaceName}` : ""}
        </p>
      ) : effectiveBoardId ? (
        <p className="text-xs text-[var(--muted)]">Choose a monday board before sending a test lead.</p>
      ) : (
        <p className="text-xs text-[var(--muted)]">Choose a monday board before sending a test lead.</p>
      )}
    </div>
  );
}
