import { useLiveQuery } from "dexie-react-hooks";
import { localDb } from "../../lib/local-db";

export function usePendingCount(): number {
  const count = useLiveQuery(() => localDb.scoutingQueue.where("synced").equals(0).count(), [], 0);
  return count ?? 0;
}
