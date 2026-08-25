import { createFileRoute } from "@tanstack/react-router";
import { DriveTeamDashboard } from "../../../features/dashboard/DriveTeamDashboard";

export const Route = createFileRoute("/events/$eventKey/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { eventKey } = Route.useParams();
  return (
    <div className="page">
      <h1>Drive Team Dashboard</h1>
      <p className="muted">A quick glance before the next match — alliance and opponent stats at a glance.</p>
      <DriveTeamDashboard eventKey={eventKey} />
    </div>
  );
}
