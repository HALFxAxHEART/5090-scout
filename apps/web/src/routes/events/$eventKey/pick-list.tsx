import { createFileRoute } from "@tanstack/react-router";
import { PickListBoard } from "../../../features/pick-list/PickListBoard";

export const Route = createFileRoute("/events/$eventKey/pick-list")({
  component: PickListPage,
});

function PickListPage() {
  const { eventKey } = Route.useParams();
  return (
    <div className="page">
      <h1>Pick List</h1>
      <p className="muted">Drag to reorder. Suggested order weighs EPA 50% / scouted average 30% / TBA rank 20%.</p>
      <PickListBoard eventKey={eventKey} />
    </div>
  );
}
