import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { SubmitScoutingRecordInput } from "@scout5090/shared";
import { useTRPC, useTRPCClient } from "../../../../../lib/trpc";
import { useCurrentUser } from "../../../../../lib/auth-client";
import { getRecord } from "../../../../../lib/local-db";
import { stableRecordId } from "../../../../../lib/ids";
import { DynamicScoutForm, type ScoutingData } from "../../../../../features/scouting/DynamicScoutForm";
import { VideoPanel, type VideoPanelHandle } from "../../../../../features/scouting/VideoPanel";
import { useScoutingSubmit } from "../../../../../features/scouting/useScoutingSubmit";

export const Route = createFileRoute("/events/$eventKey/scout/$matchKey/$teamKey")({
  component: ScoutMatchPage,
});

function ScoutMatchPage() {
  const { eventKey, matchKey, teamKey } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const { user } = useCurrentUser();
  const { submit, status, error } = useScoutingSubmit();

  const { data: eventData } = useQuery(trpc.event.get.queryOptions({ eventKey }));
  const { data: season } = useQuery(trpc.season.getActive.queryOptions());

  const match = eventData?.matches.find((m) => m.key === matchKey);
  const team = eventData?.teams.find((t) => t.key === teamKey);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [data, setData] = useState<ScoutingData>({});
  const [eventLog, setEventLog] = useState<SubmitScoutingRecordInput["eventLog"]>([]);
  const [notes, setNotes] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const videoRef = useRef<VideoPanelHandle>(null);

  const recordId = stableRecordId(matchKey, teamKey, user?.id ?? "anon");

  useEffect(() => {
    if (match) setVideoUrl((current) => current ?? match.videoUrl ?? null);
  }, [match]);

  useEffect(() => {
    getRecord(recordId).then((existing) => {
      if (existing) {
        setData(existing.data as ScoutingData);
        setEventLog(existing.eventLog);
        setNotes(existing.notes ?? "");
      }
      setDraftLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  if (!eventData || !season || !draftLoaded) return <p className="muted">Loading…</p>;
  if (!match || !team) return <p className="error-text">Match or team not found.</p>;

  const allianceColor = match.redTeams.includes(teamKey) ? "red" : "blue";
  const station = (allianceColor === "red" ? match.redTeams : match.blueTeams).indexOf(teamKey) + 1;
  const gameSchema = season.gameSchema as import("@scout5090/shared").GameSchema;
  const seasonYear = season.year;

  function handleElementChange(elementId: string, value: number | boolean | string) {
    setData((prev) => ({ ...prev, [elementId]: value }));
    setEventLog((prev) => [
      ...prev,
      { elementId, value, videoTimestampSeconds: videoRef.current?.getCurrentTime() ?? null, at: Date.now() },
    ]);
  }

  async function handleSubmit() {
    const record: SubmitScoutingRecordInput = {
      id: recordId,
      matchKey,
      scoutedTeamKey: teamKey,
      allianceColor,
      station,
      seasonYear,
      scoutUserId: user?.id ?? null,
      scoutDisplayName: user?.displayName ?? "Unknown scout",
      data,
      eventLog,
      notes: notes || null,
      syncedVia: "direct",
      clientCreatedAt: new Date().toISOString(),
    };
    await submit(record);
  }

  async function handleVideoUrlSave() {
    // Only a genuine edit counts as a manual override — don't mark TBA's own URL as
    // manual just because the scout clicked into the field and back out.
    if (videoUrl === (match?.videoUrl ?? null)) return;
    await trpcClient.event.setMatchVideoUrl.mutate({ matchKey, videoUrl });
  }

  return (
    <div className="page">
      <h1>
        {match.compLevel.toUpperCase()} {match.matchNumber} — Team {team.teamNumber}
      </h1>
      <p className={`badge ${allianceColor}`}>
        {allianceColor} {station}
      </p>

      <div className="field">
        <label htmlFor="videoUrl">Match video URL (optional)</label>
        <input
          id="videoUrl"
          placeholder="https://youtube.com/watch?v=…"
          value={videoUrl ?? ""}
          onChange={(e) => setVideoUrl(e.target.value || null)}
          onBlur={handleVideoUrlSave}
        />
      </div>
      <VideoPanel ref={videoRef} videoUrl={videoUrl} />

      <DynamicScoutForm gameSchema={gameSchema} data={data} onElementChange={handleElementChange} />

      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <button type="button" className="button primary" onClick={handleSubmit} disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : "Save scouting record"}
      </button>
      {status === "synced" && <p style={{ color: "var(--success)" }}>Saved and synced.</p>}
      {status === "queued-offline" && (
        <p style={{ color: "var(--warning)" }}>
          Saved locally — no connection, it&apos;ll sync via the Sync page.
          {error && <span className="muted"> ({error})</span>}
        </p>
      )}

      <button type="button" className="button" onClick={() => navigate({ to: "/events/$eventKey", params: { eventKey } })} style={{ marginTop: "1rem" }}>
        Back to event
      </button>
    </div>
  );
}
