import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "../../../lib/trpc";

export const Route = createFileRoute("/events/$eventKey/")({
  component: EventDetailPage,
});

function EventDetailPage() {
  const { eventKey } = Route.useParams();
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.event.get.queryOptions({ eventKey }));

  if (isLoading) return <p className="muted">Loading…</p>;
  if (!data) return <p className="error-text">Event not found.</p>;

  const teamNumberByKey = new Map(data.teams.map((t) => [t.key, t.teamNumber]));

  return (
    <div className="page">
      <div className="card-row">
        <h1>{data.event.name}</h1>
        <Link to="/events/$eventKey/pick-list" params={{ eventKey }} className="button-link primary">
          Pick List
        </Link>
      </div>
      <p className="muted">
        {data.teams.length} teams · {data.matches.length} matches
      </p>

      <h2>Matches</h2>
      {data.matches.length === 0 && <p className="muted">No matches ingested yet.</p>}
      {data.matches.map((match) => (
        <div key={match.key} className="card">
          <div className="card-row">
            <strong>
              {match.compLevel.toUpperCase()} {match.matchNumber}
            </strong>
            {match.redScore !== null && match.blueScore !== null && (
              <span className="muted">
                {match.redScore} – {match.blueScore}
              </span>
            )}
          </div>
          <div className="card-row" style={{ marginTop: "0.5rem", flexWrap: "wrap", gap: "0.4rem" }}>
            {match.redTeams.map((teamKey) => (
              <Link
                key={teamKey}
                to="/events/$eventKey/scout/$matchKey/$teamKey"
                params={{ eventKey, matchKey: match.key, teamKey }}
                className="badge red"
                style={{ textDecoration: "none" }}
              >
                {teamNumberByKey.get(teamKey) ?? teamKey}
              </Link>
            ))}
            {match.blueTeams.map((teamKey) => (
              <Link
                key={teamKey}
                to="/events/$eventKey/scout/$matchKey/$teamKey"
                params={{ eventKey, matchKey: match.key, teamKey }}
                className="badge blue"
                style={{ textDecoration: "none" }}
              >
                {teamNumberByKey.get(teamKey) ?? teamKey}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
