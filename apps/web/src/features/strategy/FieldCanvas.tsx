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
 * Generic FRC field outline (54x27ft rectangle, two 3-driver-station alliance zones) —
 * placeholder art since the 2027 field hasn't been revealed at Kickoff yet. Swap this
 * once it has, same as the per-season game schema in packages/shared/src/games.
 */
function FieldOutline() {
  return (
    <svg viewBox="0 0 540 270" className="field-outline" preserveAspectRatio="none">
      <rect x="1" y="1" width="538" height="268" fill="#0b1220" stroke="#263049" strokeWidth="2" />
      <rect x="1" y="1" width="60" height="268" fill="#7f1d1d33" />
      <rect x="479" y="1" width="60" height="268" fill="#1e3a8a33" />
      {[0, 1, 2].map((i) => (
        <line key={`r${i}`} x1="30" y1={i * 90 + 5} x2="30" y2={i * 90 + 85} stroke="#7f1d1d" strokeWidth="2" />
      ))}
      {[0, 1, 2].map((i) => (
        <line key={`b${i}`} x1="510" y1={i * 90 + 5} x2="510" y2={i * 90 + 85} stroke="#1e3a8a" strokeWidth="2" />
      ))}
      <line x1="270" y1="1" x2="270" y2="269" stroke="#263049" strokeWidth="1" strokeDasharray="4 4" />
    </svg>
  );
}
