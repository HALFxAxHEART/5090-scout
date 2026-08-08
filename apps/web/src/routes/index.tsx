import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="page hero">
      <h1>Team 5090 Scouting</h1>
      <p>
        Manual + video-assisted match scouting, TBA/Statbotics data, and an alliance-selection
        pick list — built to keep working with no signal at the event.
      </p>
      <div className="hero-actions">
        <Link to="/events" className="button-link primary">
          Browse Events
        </Link>
        <Link to="/sync" className="button-link">
          Offline Sync
        </Link>
      </div>
    </div>
  );
}
