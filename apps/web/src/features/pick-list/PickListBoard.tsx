import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "../../lib/trpc";
import { useCurrentUser } from "../../lib/auth-client";

const COMMON_TAGS = ["1st pick", "2nd pick", "avoid", "defense", "climb-reliable"];

export function PickListBoard({ eventKey }: { eventKey: string }) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const listQuery = useQuery(trpc.pickList.get.queryOptions({ eventKey }));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);

  const reorderMutation = useMutation(
    trpc.pickList.reorder.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.pickList.get.queryKey({ eventKey }) }),
    }),
  );

  const rows = listQuery.data ?? [];

  function onDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const reordered = [...rows];
    const [moved] = reordered.splice(dragIndex, 1);
    if (moved) reordered.splice(targetIndex, 0, moved);
    setDragIndex(null);
    reorderMutation.mutate({ eventKey, orderedTeamKeys: reordered.map((r) => r.teamKey) });
  }

  async function applySuggestedOrder() {
    const suggested = await trpcClient.pickList.suggestOrder.query({ eventKey });
    reorderMutation.mutate({ eventKey, orderedTeamKeys: suggested });
  }

  async function exportCsv() {
    const csv = await trpcClient.pickList.exportCsv.query({ eventKey });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventKey}-pick-list.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (listQuery.isLoading) return <p className="muted">Loading…</p>;

  return (
    <div>
      <div className="card-row" style={{ marginBottom: "1rem" }}>
        <button type="button" className="button" onClick={applySuggestedOrder} disabled={!user}>
          Suggest order
        </button>
        <button type="button" className="button" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      {rows.length === 0 && <p className="muted">No teams at this event yet.</p>}

      {rows.map((row, index) => (
        <div
          key={row.teamKey}
          className={`pick-list-row ${dragIndex === index ? "dragging" : ""}`}
          draggable={Boolean(user)}
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(index)}
        >
          <span className="pick-list-rank">{index + 1}</span>
          <span className="pick-list-team">{row.teamNumber}</span>
          <div className="pick-list-stats">
            <span>Rank: {row.tbaRank ?? "—"}</span>
            <span>EPA: {row.epaNorm?.toFixed(1) ?? "—"}</span>
            <span>
              Scouted avg: {row.scoutedAvgTotal?.toFixed(1) ?? "—"} ({row.scoutedMatchCount})
            </span>
          </div>
          <div className="pick-list-tags">
            {row.tags.map((tag) => (
              <span key={tag} className="badge">
                {tag}
              </span>
            ))}
          </div>
          <button type="button" className="button" onClick={() => setEditingTeam(row.teamKey)} disabled={!user}>
            Edit
          </button>
        </div>
      ))}

      {editingTeam && (
        <EditEntryDialog
          eventKey={eventKey}
          teamKey={editingTeam}
          row={rows.find((r) => r.teamKey === editingTeam)}
          onClose={() => setEditingTeam(null)}
        />
      )}
    </div>
  );
}

function EditEntryDialog({
  eventKey,
  teamKey,
  row,
  onClose,
}: {
  eventKey: string;
  teamKey: string;
  row: { tags: string[]; notes: string | null; teamNumber: number } | undefined;
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<string[]>(row?.tags ?? []);
  const [notes, setNotes] = useState(row?.notes ?? "");

  const updateMutation = useMutation(
    trpc.pickList.updateEntry.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.pickList.get.queryKey({ eventKey }) });
        onClose();
      },
    }),
  );

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  return (
    <div className="card" style={{ marginTop: "1rem" }}>
      <h3>Team {row?.teamNumber}</h3>
      <div className="select-pills" style={{ marginBottom: "0.75rem" }}>
        {COMMON_TAGS.map((tag) => (
          <button key={tag} type="button" className={`button ${tags.includes(tag) ? "selected" : ""}`} onClick={() => toggleTag(tag)}>
            {tag}
          </button>
        ))}
      </div>
      <div className="field">
        <label htmlFor="pick-notes">Notes</label>
        <textarea id="pick-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="card-row">
        <button type="button" className="button" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="button primary"
          onClick={() => updateMutation.mutate({ eventKey, teamKey, tags, notes: notes || null })}
          disabled={updateMutation.isPending}
        >
          Save
        </button>
      </div>
    </div>
  );
}
