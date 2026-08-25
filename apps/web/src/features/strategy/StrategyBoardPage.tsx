import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EMPTY_BOARD_DATA, type BoardData, type StrategyPhase } from "@scout5090/shared";
import { useTRPC } from "../../lib/trpc";
import { useCurrentUser } from "../../lib/auth-client";
import { VideoPanel } from "../scouting/VideoPanel";
import { FieldCanvas } from "./FieldCanvas";

const RED_SHADES = ["#fca5a5", "#f87171", "#b91c1c"];
const BLUE_SHADES = ["#93c5fd", "#60a5fa", "#1d4ed8"];
const DEFAULT_RED = "#f87171";
const DEFAULT_BLUE = "#60a5fa";
const NEUTRAL = "#e7ebf3";
const PHASES: { id: StrategyPhase; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

export function StrategyBoardPage({ eventKey, matchKey }: { eventKey: string; matchKey: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  const { data: eventData } = useQuery(trpc.event.get.queryOptions({ eventKey }));
  const boardQuery = useQuery(trpc.strategyBoard.getForMatch.queryOptions({ matchKey }));
  const templatesQuery = useQuery(trpc.strategyBoard.listTemplates.queryOptions({ eventKey }));

  const match = eventData?.matches.find((m) => m.key === matchKey);
  const teamNumberByKey = new Map((eventData?.teams ?? []).map((t) => [t.key, t.teamNumber]));

  const [phase, setPhase] = useState<StrategyPhase>("auto");
  const [boardData, setBoardData] = useState<BoardData>(EMPTY_BOARD_DATA);
  const [loadedFromServer, setLoadedFromServer] = useState(false);
  const [color, setColor] = useState(NEUTRAL);

  useEffect(() => {
    if (boardQuery.isSuccess && !loadedFromServer) {
      setBoardData(boardQuery.data?.boardData ?? EMPTY_BOARD_DATA);
      setLoadedFromServer(true);
    }
  }, [boardQuery.isSuccess, boardQuery.data, loadedFromServer]);

  const colorOptions = useMemo(() => {
    if (!match) return [{ teamKey: null as string | null, label: "Notes", color: NEUTRAL }];
    return [
      ...match.redTeams.map((teamKey, i) => ({
        teamKey,
        label: String(teamNumberByKey.get(teamKey) ?? teamKey),
        color: RED_SHADES[i] ?? DEFAULT_RED,
      })),
      ...match.blueTeams.map((teamKey, i) => ({
        teamKey,
        label: String(teamNumberByKey.get(teamKey) ?? teamKey),
        color: BLUE_SHADES[i] ?? DEFAULT_BLUE,
      })),
      { teamKey: null, label: "Notes", color: NEUTRAL },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match]);

  const saveForMatchMutation = useMutation(
    trpc.strategyBoard.saveForMatch.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.strategyBoard.getForMatch.queryKey({ matchKey }) }),
    }),
  );
  const saveTemplateMutation = useMutation(
    trpc.strategyBoard.saveTemplate.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.strategyBoard.listTemplates.queryKey({ eventKey }) }),
    }),
  );
  const applyTemplateMutation = useMutation(
    trpc.strategyBoard.applyTemplate.mutationOptions({
      onSuccess: (board) => {
        setBoardData(board.boardData);
        queryClient.invalidateQueries({ queryKey: trpc.strategyBoard.getForMatch.queryKey({ matchKey }) });
      },
    }),
  );

  function addStroke(stroke: { color: string; points: { x: number; y: number }[] }) {
    setBoardData((prev) => ({ ...prev, [phase]: [...prev[phase], stroke] }));
  }

  function undo() {
    setBoardData((prev) => ({ ...prev, [phase]: prev[phase].slice(0, -1) }));
  }

  function clearPhase() {
    setBoardData((prev) => ({ ...prev, [phase]: [] }));
  }

  function handleSaveAsTemplate() {
    const name = window.prompt("Name this strategy template:");
    if (!name) return;
    saveTemplateMutation.mutate({ eventKey, name, boardData });
  }

  if (!match) return <p className="muted">Loading…</p>;

  return (
    <div>
      {match.videoUrl && <VideoPanel videoUrl={match.videoUrl} />}

      <div className="strategy-phase-tabs">
        {PHASES.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`button ${phase === p.id ? "primary" : ""}`}
            onClick={() => setPhase(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="strategy-color-picker">
        {colorOptions.map((c) => (
          <button
            key={c.teamKey ?? "notes"}
            type="button"
            className={`strategy-color-swatch ${color === c.color ? "selected" : ""}`}
            style={{ background: c.color }}
            onClick={() => setColor(c.color)}
            title={c.label}
          >
            {c.teamKey ? c.label : "✎"}
          </button>
        ))}
      </div>

      <FieldCanvas strokes={boardData[phase]} color={color} onStrokeComplete={addStroke} readOnly={!user} />

      <div className="card-row strategy-controls">
        <button type="button" className="button" onClick={undo} disabled={!user || boardData[phase].length === 0}>
          Undo
        </button>
        <button type="button" className="button" onClick={clearPhase} disabled={!user || boardData[phase].length === 0}>
          Clear {phase}
        </button>
        <select
          value=""
          onChange={(e) => e.target.value && applyTemplateMutation.mutate({ templateId: e.target.value, matchKey })}
          disabled={!user || !templatesQuery.data?.length}
        >
          <option value="">Apply a template…</option>
          {templatesQuery.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button type="button" className="button" onClick={handleSaveAsTemplate} disabled={!user}>
          Save as template
        </button>
        <button
          type="button"
          className="button primary"
          onClick={() => saveForMatchMutation.mutate({ matchKey, boardData })}
          disabled={!user || saveForMatchMutation.isPending}
        >
          {saveForMatchMutation.isPending ? "Saving…" : "Save"}
        </button>
      </div>
      {saveForMatchMutation.isSuccess && <p style={{ color: "var(--success)" }}>Saved.</p>}
      {!user && <p className="muted">Sign in to draw or save.</p>}
    </div>
  );
}
