import { useState } from "react";
import type { SubmitScoutingRecordInput } from "@scout5090/shared";
import { useTRPCClient } from "../../lib/trpc";
import { markSynced, savePendingRecord } from "../../lib/local-db";

export type SubmitStatus = "idle" | "saving" | "synced" | "queued-offline";

export function useScoutingSubmit() {
  const trpcClient = useTRPCClient();
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(record: SubmitScoutingRecordInput) {
    setStatus("saving");
    setError(null);
    // Always land in the local queue first — the form must never block on network.
    await savePendingRecord(record);
    try {
      await trpcClient.scouting.submit.mutate(record);
      await markSynced(record.id);
      setStatus("synced");
    } catch (err) {
      // Offline or the request failed — that's fine, it stays queued for direct retry
      // later or for QR export from the Sync page.
      setStatus("queued-offline");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return { submit, status, error };
}
