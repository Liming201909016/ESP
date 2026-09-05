import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

interface PersistedReview {
  correlationId: string;
  state?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

let writeQueue = Promise.resolve();
const terminalStates = new Set(["Completed", "RejectedByAnalyst", "Escalated", "CannotAssess"]);
const defaultRetentionMs = 7 * 24 * 60 * 60 * 1000;

function storePath() {
  const directory = process.env.ESP_DATA_DIR ?? resolve(process.cwd(), ".esp-data");
  const file = resolve(directory, "reviews.json");
  return { directory, file, backupFile: `${file}.bak` };
}

function parseStore(contents: string): Record<string, PersistedReview> {
  const records = JSON.parse(contents) as unknown;
  if (!records || typeof records !== "object" || Array.isArray(records)) {
    throw new TypeError("Review store must contain an object");
  }
  return records as Record<string, PersistedReview>;
}

async function readStoreFile(file: string) {
  return parseStore(await readFile(file, "utf8"));
}

async function replaceFile(file: string, contents: string) {
  const temporaryFile = `${file}.${process.pid}.${randomUUID()}.tmp`;
  const handle = await open(temporaryFile, "wx");
  try {
    await handle.writeFile(contents, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename(temporaryFile, file);
  } catch (error) {
    try {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST" && (error as NodeJS.ErrnoException).code !== "EPERM") throw error;
      await rm(file, { force: true });
      await rename(temporaryFile, file);
    } catch (replacementError) {
      await rm(temporaryFile, { force: true });
      throw replacementError;
    }
  }
}

async function readStore(): Promise<Record<string, PersistedReview>> {
  const { directory, file, backupFile } = storePath();
  try {
    return await readStoreFile(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      try {
        const recovered = await readStoreFile(backupFile);
        await mkdir(directory, { recursive: true });
        await replaceFile(file, `${JSON.stringify(recovered, null, 2)}\n`);
        return recovered;
      } catch (backupError) {
        if ((backupError as NodeJS.ErrnoException).code === "ENOENT") return {};
        throw backupError;
      }
    }

    const recovered = await readStoreFile(backupFile);
    await mkdir(directory, { recursive: true });
    await replaceFile(file, `${JSON.stringify(recovered, null, 2)}\n`);
    return recovered;
  }
}

async function writeStore(records: Record<string, PersistedReview>) {
  const { directory, file, backupFile } = storePath();
  await mkdir(directory, { recursive: true });
  const contents = `${JSON.stringify(records, null, 2)}\n`;
  await replaceFile(file, contents);
  await replaceFile(backupFile, contents);
}

function retentionMs() {
  const configured = Number(process.env.ESP_REVIEW_RETENTION_MS ?? defaultRetentionMs);
  return Number.isFinite(configured) && configured >= 0 ? configured : defaultRetentionMs;
}

function removeExpiredTerminalReviews(records: Record<string, PersistedReview>, now: number) {
  let removed = 0;
  for (const [correlationId, review] of Object.entries(records)) {
    const updatedAt = review.updatedAt ? Date.parse(review.updatedAt) : Number.NaN;
    if (review.state && terminalStates.has(review.state) && Number.isFinite(updatedAt) && now - updatedAt >= retentionMs()) {
      delete records[correlationId];
      removed += 1;
    }
  }
  return removed;
}

export async function saveReview<T extends PersistedReview>(review: T) {
  writeQueue = writeQueue.then(async () => {
    const records = await readStore();
    removeExpiredTerminalReviews(records, Date.now());
    records[review.correlationId] = { ...review, updatedAt: new Date().toISOString() };
    await writeStore(records);
  });
  await writeQueue;
  return review;
}

export async function loadReview<T extends PersistedReview>(correlationId: string): Promise<T | undefined> {
  await writeQueue;
  return (await readStore())[correlationId] as T | undefined;
}

export async function cleanupExpiredReviews(now = Date.now()) {
  let removed = 0;
  writeQueue = writeQueue.then(async () => {
    const records = await readStore();
    removed = removeExpiredTerminalReviews(records, now);
    if (removed) await writeStore(records);
  });
  await writeQueue;
  return removed;
}