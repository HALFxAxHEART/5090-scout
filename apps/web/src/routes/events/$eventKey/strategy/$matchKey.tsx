import { createFileRoute } from "@tanstack/react-router";
import { StrategyBoardPage } from "../../../../features/strategy/StrategyBoardPage";

export const Route = createFileRoute("/events/$eventKey/strategy/$matchKey")({
  component: StrategyRoutePage,
});

function StrategyRoutePage() {
  const { eventKey, matchKey } = Route.useParams();
  return (
    <div className="page">
      <h1>Strategy Board</h1>
      <StrategyBoardPage eventKey={eventKey} matchKey={matchKey} />
    </div>
  );
}
