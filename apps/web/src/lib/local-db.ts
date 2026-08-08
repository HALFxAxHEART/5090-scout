import Dexie, { type EntityTable } from "dexie";
import type { SubmitScoutingRecordInput } from "@scout5090/shared";

export interface QueuedRecord extends SubmitScoutingRecordInput {
  synced: 0 | 1; // Dexie can't index booleans; 0/1 keeps `synced` queryable
}

/** A locally recorded match clip — never uploaded whole, only sampled frames are (for AI review). */
export interface LocalClip {
  key: string; // `${matchKey}:${teamKey}`
  blob: Blob;
  createdAt: number;
}

const db = new Dexie("scout5090") as Dexie & {
  scoutingQueue: EntityTable<QueuedRecord, "id">;
  localClips: EntityTable<LocalClip, "key">;
};

db.version(1).stores({
  scoutingQueue: "id, synced, matchKey, seasonYear",
});

db.version(2).stores({
  scoutingQueue: "id, synced, matchKey, seasonYear",
  localClips: "key",
});

export { db as localDb };

export async function savePendingRecord(record: SubmitScoutingRecordInput): Promise<void> {
  await db.scoutingQueue.put({ ...record, synced: 0 });
}

export async function markSynced(id: string): Promise<void> {
  await db.scoutingQueue.update(id, { synced: 1 });
}

export async function getPendingRecords(): Promise<QueuedRecord[]> {
  return db.scoutingQueue.where("synced").equals(0).toArray();
}

export async function getRecord(id: string): Promise<QueuedRecord | undefined> {
  return db.scoutingQueue.get(id);
}

export async function saveLocalClip(key: string, blob: Blob): Promise<void> {
  await db.localClips.put({ key, blob, createdAt: Date.now() });
}

export async function getLocalClip(key: string): Promise<LocalClip | undefined> {
  return db.localClips.get(key);
}
