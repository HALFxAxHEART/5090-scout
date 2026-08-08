import type { GameSchema, ScoringElement } from "@scout5090/shared";
import { computeTotalScore } from "@scout5090/shared";

export type ScoutingData = Record<string, number | boolean | string>;

interface DynamicScoutFormProps {
  gameSchema: GameSchema;
  data: ScoutingData;
  onElementChange: (elementId: string, value: number | boolean | string) => void;
}

export function DynamicScoutForm({ gameSchema, data, onElementChange }: DynamicScoutFormProps) {
  return (
    <div>
      <div className="card-row">
        <span className="muted">Live total</span>
        <span className="score-total">{computeTotalScore(gameSchema, data)} pts</span>
      </div>
      {gameSchema.phases.map((phase) => (
        <div key={phase.id} className="phase-section">
          <h3>{phase.label}</h3>
          {phase.elements.map((element) => (
            <ElementControl
              key={element.id}
              element={element}
              value={data[element.id]}
              onChange={(value) => onElementChange(element.id, value)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function ElementControl({
  element,
  value,
  onChange,
}: {
  element: ScoringElement;
  value: number | boolean | string | undefined;
  onChange: (value: number | boolean | string) => void;
}) {
  if (element.type === "counter") {
    const count = typeof value === "number" ? value : 0;
    return (
      <div className="element-row">
        <span>{element.label}</span>
        <div className="counter-controls">
          <button type="button" className="button" onClick={() => onChange(Math.max(0, count - 1))} disabled={count <= 0}>
            −
          </button>
          <span className="counter-value">{count}</span>
          <button
            type="button"
            className="button"
            onClick={() => onChange(element.max ? Math.min(element.max, count + 1) : count + 1)}
            disabled={element.max !== undefined && count >= element.max}
          >
            +
          </button>
        </div>
      </div>
    );
  }

  if (element.type === "boolean") {
    const on = value === true;
    return (
      <div className="element-row">
        <span>{element.label}</span>
        <button type="button" className={`button toggle-button ${on ? "on" : ""}`} onClick={() => onChange(!on)}>
          {on ? "Yes" : "No"}
        </button>
      </div>
    );
  }

  // select
  return (
    <div className="element-row">
      <span>{element.label}</span>
      <div className="select-pills">
        {element.options?.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`button ${value === option.value ? "selected" : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
