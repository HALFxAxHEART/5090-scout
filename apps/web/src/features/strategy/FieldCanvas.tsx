import { useEffect, useRef } from "react";
import type { Stroke } from "@scout5090/shared";

interface FieldCanvasProps {
  strokes: Stroke[];
  color: string;
  readOnly?: boolean;
  onStrokeComplete: (stroke: Stroke) => void;
}

/** Freehand drawing over a field outline. Points are stored as 0-1 fractions of the
 * canvas size so a saved board redraws correctly at any screen size. */
export function FieldCanvas({ strokes, color, readOnly, onStrokeComplete }: FieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<{ x: number; y: number }[] | null>(null);

  function redraw(liveStroke?: { x: number; y: number }[]) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const all: Stroke[] = liveStroke ? [...strokes, { color, points: liveStroke }] : strokes;
    for (const stroke of all) {
      if (stroke.points.length < 2) continue;
      const first = stroke.points[0];
      if (!first) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(first.x * canvas.width, first.y * canvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        if (!p) continue;
        ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
      }
      ctx.stroke();
    }
  }

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw();
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  function toFraction(e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (readOnly) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = [toFraction(e)];
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current.push(toFraction(e));
    redraw(drawingRef.current);
  }

  function handlePointerUp() {
    const points = drawingRef.current;
    drawingRef.current = null;
    if (points && points.length >= 2) onStrokeComplete({ color, points });
    redraw();
  }

  return (
    <div ref={containerRef} className="field-canvas-wrap">
      <FieldOutline />
      <canvas
        ref={canvasRef}
        className="field-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}

/**
 * Approximate 2026 REBUILT field schematic — real zone names/roles (HUB, TOWER, DEPOT,
 * OUTPOST, NEUTRAL ZONE, ALLIANCE AREA) from the same public post-kickoff summaries as
 * the Kickoff app's GAME_2026_REBUILT breakdown. Only the Neutral Zone's size is a real
 * cited dimension (206in x 72in against a standard ~54x27ft field); everything else's
 * exact placement is illustrative, not the certified field — swap for real field art
 * once it's published. See the "approximate schematic" caption shown under the canvas.
 */
function FieldOutline() {
  return (
    <svg viewBox="0 0 540 270" className="field-outline" preserveAspectRatio="none">
      <rect x="1" y="1" width="538" height="268" fill="#0b1220" stroke="#263049" strokeWidth="2" />

      {/* Red alliance (left) */}
      <rect x="1" y="1" width="36" height="268" fill="#7f1d1d33" />
      <rect x="40" y="8" width="55" height="62" fill="none" stroke="#7f1d1d" strokeWidth="1.5" />
      <text x="67" y="43" className="field-label" textAnchor="middle">DEPOT</text>
      <rect x="40" y="200" width="55" height="62" fill="none" stroke="#7f1d1d" strokeWidth="1.5" />
      <text x="67" y="235" className="field-label" textAnchor="middle">OUTPOST</text>
      <circle cx="125" cy="135" r="26" fill="none" stroke="#7f1d1d" strokeWidth="1.5" />
      <text x="125" y="139" className="field-label" textAnchor="middle">HUB</text>
      <rect x="155" y="20" width="27" height="230" fill="none" stroke="#7f1d1d" strokeWidth="1.5" />
      <text x="168" y="139" className="field-label" textAnchor="middle" transform="rotate(-90 168 139)">TOWER</text>

      {/* Blue alliance (right), mirrored */}
      <rect x="503" y="1" width="36" height="268" fill="#1e3a8a33" />
      <rect x="445" y="8" width="55" height="62" fill="none" stroke="#1e3a8a" strokeWidth="1.5" />
      <text x="472" y="43" className="field-label" textAnchor="middle">DEPOT</text>
      <rect x="445" y="200" width="55" height="62" fill="none" stroke="#1e3a8a" strokeWidth="1.5" />
      <text x="472" y="235" className="field-label" textAnchor="middle">OUTPOST</text>
      <circle cx="415" cy="135" r="26" fill="none" stroke="#1e3a8a" strokeWidth="1.5" />
      <text x="415" y="139" className="field-label" textAnchor="middle">HUB</text>
      <rect x="358" y="20" width="27" height="230" fill="none" stroke="#1e3a8a" strokeWidth="1.5" />
      <text x="371" y="139" className="field-label" textAnchor="middle" transform="rotate(-90 371 139)">TOWER</text>

      {/* Neutral zone — sized from the cited ~206in x 72in against a standard 54x27ft field */}
      <rect x="184" y="105" width="172" height="60" fill="#26304955" stroke="#263049" strokeWidth="1.5" strokeDasharray="4 4" />
      <text x="270" y="139" className="field-label" textAnchor="middle">NEUTRAL ZONE</text>
    </svg>
  );
}
