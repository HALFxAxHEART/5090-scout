import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useTRPCClient } from "../lib/trpc";
import { localDb, markSynced } from "../lib/local-db";
import { decodePayloadToRecord } from "../lib/qr";
import { QrExport } from "../features/sync/QrExport";
import { QrScanner } from "../features/sync/QrScanner";

export const Route = createFileRoute("/sync")({
  component: SyncPage,
});

function SyncPage() {
  const [tab, setTab] = useState<"queue" | "scan">("queue");
  const pending = useLiveQuery(() => localDb.scoutingQueue.where("synced").equals(0).toArray(), [], []);
  const synced = useLiveQuery(() => localDb.scoutingQueue.where("synced").equals(1).toArray(), [], []);
  const [showingId, setShowingId] = useState<string | null>(null);
  const trpcClient = useTRPCClient();
  const [importLog, setImportLog] = useState<string[]>([]);

  async function handleDecode(payload: string) {
    try {
      const record = decodePayloadToRecord(payload);
      await trpcClient.scouting.submit.mutate({ ...record, syncedVia: "qr" });
      await localDb.scoutingQueue.put({ ...record, synced: 1, syncedVia: "qr" });
      setImportLog((log) => [`Imported match ${record.matchKey} — team ${record.scoutedTeamKey.replace("frc", "")}`, ...log].slice(0, 20));
    } catch (err) {
      setImportLog((log) => [`Failed to import: ${err instanceof Error ? err.message : String(err)}`, ...log].slice(0, 20));
    }
  }

  async function retryDirect(id: string) {
    const record = pending?.find((r) => r.id === id);
    if (!record) return;
    try {
      await trpcClient.scouting.submit.mutate(record);
      await markSynced(id);
    } catch {
      // still offline — stays in the queue
    }
  }

  const showingRecord = pending?.find((r) => r.id === showingId);

  return (
    <div className="page">
      <h1>Sync</h1>
      <div className="card-row" style={{ marginBottom: "1rem" }}>
        <button type="button" className={`button ${tab === "queue" ? "primary" : ""}`} onClick={() => setTab("queue")}>
          My Queue ({pending?.length ?? 0})
        </button>
        <button type="button" className={`button ${tab === "scan" ? "primary" : ""}`} onClick={() => setTab("scan")}>
          Scan (sync station)
        </button>
      </div>

      {tab === "queue" && (
        <div className="queue-list">
          {pending?.length === 0 && <p className="muted">Nothing pending — everything&apos;s synced.</p>}
          {pending?.map((record) => (
            <div key={record.id} className="card card-row">
              <div>
                <strong>{record.matchKey}</strong>
                <span className="muted"> — team {record.scoutedTeamKey.replace("frc", "")}</span>
                <div className="badge status-pending">not synced</div>
              </div>
              <div className="card-row" style={{ gap: "0.5rem" }}>
                <button type="button" className="button" onClick={() => retryDirect(record.id)}>
                  Retry online
                </button>
                <button type="button" className="button primary" onClick={() => setShowingId(record.id)}>
                  Show QR
                </button>
              </div>
            </div>
          ))}

          {showingRecord && <QrExport record={showingRecord} onClose={() => setShowingId(null)} />}

          {(synced?.length ?? 0) > 0 && (
            <>
              <h3 style={{ marginTop: "1.5rem" }}>Synced ({synced?.length})</h3>
              {synced?.map((record) => (
                <div key={record.id} className="card card-row">
                  <div>
                    <strong>{record.matchKey}</strong>
                    <span className="muted"> — team {record.scoutedTeamKey.replace("frc", "")}</span>
                  </div>
                  <div className="badge status-ok">synced ({record.syncedVia})</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === "scan" && (
        <div>
          <p className="muted">Point this device&apos;s camera at another scout&apos;s QR code — it uploads as soon as it&apos;s decoded.</p>
          <QrScanner onDecode={handleDecode} />
          <div className="queue-list" style={{ marginTop: "1rem" }}>
            {importLog.map((line, i) => (
              <p key={i} className="muted">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
