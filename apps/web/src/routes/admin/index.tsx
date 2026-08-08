import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GAME_SCHEMAS, DEFAULT_TEAM_NUMBER } from "@scout5090/shared";
import { useTRPC } from "../../lib/trpc";
import { useCurrentUser } from "../../lib/auth-client";

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
});

function AdminPage() {
  const { user, isLoading } = useCurrentUser();
  if (isLoading) return <p className="muted">Loading…</p>;
  if (user?.role !== "admin") return <p className="error-text">Admins only.</p>;
  return (
    <div className="page">
      <h1>Admin</h1>
      <SeasonPanel />
      <IngestPanel />
    </div>
  );
}

function SeasonPanel() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: seasons } = useQuery(trpc.season.list.queryOptions());
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [gameName, setGameName] = useState("");
  const [schemaJson, setSchemaJson] = useState(() => JSON.stringify(GAME_SCHEMAS[2025], null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const createMutation = useMutation(
    trpc.season.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.season.list.queryKey() }),
    }),
  );
  const setActiveMutation = useMutation(
    trpc.season.setActive.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.season.list.queryKey() }),
    }),
  );

  function handleCreate() {
    setJsonError(null);
    let gameSchema;
    try {
      gameSchema = JSON.parse(schemaJson);
    } catch {
      setJsonError("That's not valid JSON.");
      return;
    }
    createMutation.mutate({ year, gameName: gameName || gameSchema.gameName, gameSchema, makeActive: true });
  }

  return (
    <div className="card">
      <h2>Season / game schema</h2>
      <p className="muted">
        One row per year. The form on the scouting page renders from whichever season is active — add a
        new one each Kickoff instead of touching form code.
      </p>

      {seasons?.map((season) => (
        <div key={season.year} className="card-row">
          <span>
            {season.year} — {season.gameName} {season.isActive && <span className="badge status-ok">active</span>}
          </span>
          {!season.isActive && (
            <button type="button" className="button" onClick={() => setActiveMutation.mutate({ year: season.year })}>
              Make active
            </button>
          )}
        </div>
      ))}

      <h3 style={{ marginTop: "1rem" }}>Add a season</h3>
      <div className="field">
        <label htmlFor="year">Year</label>
        <input id="year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
      </div>
      <div className="field">
        <label htmlFor="gameName">Game name</label>
        <input id="gameName" value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="e.g. next year's game" />
      </div>
      <div className="field">
        <label htmlFor="schemaJson">Game schema (JSON) — starts from the bundled 2025 example</label>
        <textarea id="schemaJson" rows={12} value={schemaJson} onChange={(e) => setSchemaJson(e.target.value)} />
        {jsonError && <p className="error-text">{jsonError}</p>}
      </div>
      <button type="button" className="button primary" onClick={handleCreate} disabled={createMutation.isPending}>
        Create & activate
      </button>
    </div>
  );
}

function IngestPanel() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [teamNumber, setTeamNumber] = useState(DEFAULT_TEAM_NUMBER);
  const [year, setYear] = useState(new Date().getFullYear());
  const [eventKey, setEventKey] = useState("");

  const ingestTeamYearMutation = useMutation(
    trpc.event.ingestTeamYear.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.event.list.queryKey() }),
    }),
  );
  const ingestEventMutation = useMutation(
    trpc.event.ingestEvent.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.event.list.queryKey() }),
    }),
  );

  return (
    <div className="card">
      <h2>Pull data from TBA / Statbotics</h2>
      <div className="field">
        <label htmlFor="teamNumber">Team number</label>
        <input id="teamNumber" type="number" value={teamNumber} onChange={(e) => setTeamNumber(Number(e.target.value))} />
      </div>
      <div className="field">
        <label htmlFor="ingestYear">Year</label>
        <input id="ingestYear" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
      </div>
      <button
        type="button"
        className="button primary"
        onClick={() => ingestTeamYearMutation.mutate({ teamNumber, year })}
        disabled={ingestTeamYearMutation.isPending}
      >
        Ingest this team&apos;s events for that year
      </button>
      {ingestTeamYearMutation.isSuccess && (
        <p className="muted">Ingested {ingestTeamYearMutation.data.length} event(s).</p>
      )}

      <h3 style={{ marginTop: "1.5rem" }}>Or ingest one event directly</h3>
      <div className="field">
        <label htmlFor="eventKey">Event key (e.g. 2026mifim)</label>
        <input id="eventKey" value={eventKey} onChange={(e) => setEventKey(e.target.value)} />
      </div>
      <button
        type="button"
        className="button"
        onClick={() => ingestEventMutation.mutate({ eventKey })}
        disabled={!eventKey || ingestEventMutation.isPending}
      >
        Ingest event
      </button>
    </div>
  );
}
