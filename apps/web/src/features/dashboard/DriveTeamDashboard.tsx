import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTRPC } from "../../lib/trpc";

export function DriveTeamDashboard({ eventKey }: { eventKey: string }) {
  const trpc = useTRPC();
  const { data: eventData } = useQuery(trpc.event.get.queryOptions({ eventKey }));
  const [selectedTeamKey, setSelectedTeamKey] = useState<string | null>(null);

  const dashboardQuery = useQuery(
    trpc.driveDashboard.get.queryOptions({ eventKey, teamKey: selectedTeamKey ?? undefined }),
  );
  const dashboard = dashboardQuery.data;

  const rosterOptions = [...(eventData?.teams ?? [])].sort((a, b) => a.teamNumber - b.teamNumber);
  const activeTeamKey = selectedTeamKey ?? dashboard?.ownTeamKey ?? "";

  if (dashboardQuery.isLoading) return <p className="muted">Loading…</p>;
  if (!dashboard) return <p className="error-text">Couldn&apos;t load the dashboard.</p>;

  return (
    <div>
      <div className="field" style={{ maxWidth: "18rem" }}>
        <label htmlFor="dashboard-team">Team</label>
        <select id="dashboard-team" value={activeTeamKey} onChange={(e) => setSelectedTeamKey(e.target.value)}>
          {rosterOptions.map((t) => (
            <option key={t.key} value={t.key}>
              {t.teamNumber}
              {t.nickname ? ` — ${t.nickname}` : ""}
            </option>
          ))}
        </select>
      </div>

      {!dashboard.match ? (
        <p className="muted">No match found for this team at this event yet.</p>
      ) : (
        <div className="card">
          <div className="card-row">
            <h2 style={{ margin: 0 }}>
              {dashboard.match.compLevel.toUpperCase()} {dashboard.match.matchNumber}
            </h2>
            {!dashboard.match.isUpcoming && <span className="badge status-pending">already played</span>}
          </div>
          <div className="dashboard-team-list">
            {dashboard.teams.map((t) => (
              <div key={t.teamKey} className="dashboard-team-row">
                <span className={`badge ${t.allianceColor}`}>{t.teamNumber}</span>
                <span className="muted dashboard-team-nickname">{t.nickname ?? ""}</span>
                <div className="dashboard-team-stats">
                  <span>EPA: {t.epaNorm?.toFixed(1) ?? "—"}</span>
                  <span>
                    Scouted avg: {t.scoutedAvgTotal?.toFixed(1) ?? "—"} ({t.scoutedMatchCount})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
