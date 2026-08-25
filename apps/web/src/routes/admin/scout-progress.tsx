import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTRPC } from "../../lib/trpc";
import { useCurrentUser } from "../../lib/auth-client";

export const Route = createFileRoute("/admin/scout-progress")({
  component: ScoutProgressPage,
});

function ScoutProgressPage() {
  const { user, isLoading } = useCurrentUser();
  if (isLoading) return <p className="muted">Loading…</p>;
  if (user?.role !== "admin") return <p className="error-text">Admins only.</p>;

  return (
    <div className="page">
      <h1>Scout Progress</h1>
      <p className="muted">How many matches each scout has logged for an event, to help coordinate volunteers.</p>
      <ScoutProgressBoard />
    </div>
  );
}

function ScoutProgressBoard() {
  const trpc = useTRPC();
  const { data: events } = useQuery(trpc.event.list.queryOptions(undefined));
  const [eventKey, setEventKey] = useState("");

  const progressQuery = useQuery({
    ...trpc.scoutProgress.get.queryOptions({ eventKey }),
    enabled: Boolean(eventKey),
  });

  return (
    <div className="card">
      <div className="field" style={{ maxWidth: "20rem" }}>
        <label htmlFor="progress-event">Event</label>
        <select id="progress-event" value={eventKey} onChange={(e) => setEventKey(e.target.value)}>
          <option value="">Select an event…</option>
          {events?.map((event) => (
            <option key={event.key} value={event.key}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      {!eventKey && <p className="muted">Pick an event to see who&apos;s scouted what.</p>}
      {eventKey && progressQuery.isLoading && <p className="muted">Loading…</p>}
      {eventKey && progressQuery.data?.length === 0 && <p className="muted">No scouting records for this event yet.</p>}

      {progressQuery.data?.map((row) => (
        <div key={row.scoutUserId ?? row.scoutDisplayName} className="card-row scout-progress-row">
          <span>{row.scoutDisplayName}</span>
          <span className="muted">
            {row.recordCount} record{row.recordCount === 1 ? "" : "s"} · {row.matchCount} match
            {row.matchCount === 1 ? "" : "es"}
          </span>
        </div>
      ))}
    </div>
  );
}
