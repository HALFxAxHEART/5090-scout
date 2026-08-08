import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "../../lib/trpc";

export const Route = createFileRoute("/events/")({
  component: EventsPage,
});

function EventsPage() {
  const trpc = useTRPC();
  const { data: events, isLoading } = useQuery(trpc.event.list.queryOptions(undefined));

  return (
    <div className="page">
      <h1>Events</h1>
      {isLoading && <p className="muted">Loading…</p>}
      {events?.length === 0 && (
        <p className="muted">
          No events ingested yet. An admin can pull them in from the Admin page once TBA has
          your team&apos;s events for the year.
        </p>
      )}
      {events?.map((event) => (
        <Link key={event.key} to="/events/$eventKey" params={{ eventKey: event.key }} className="card" style={{ display: "block", textDecoration: "none" }}>
          <div className="card-row">
            <div>
              <strong>{event.name}</strong>
              <div className="muted">
                {event.city ? `${event.city}, ${event.stateProv} — ` : ""}
                {event.startDate}
              </div>
            </div>
            <span className="muted">{event.year}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
