import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
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
  return { directory, file: resolve(directory, "reviews.json") };
}

async function readStore(): Promise<Record<string, PersistedReview>> {
  const { file } = storePath();
  try {
    return JSON.parse(await readFile(file, "utf8")) as Record<string, PersistedReview>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

async function writeStore(records: Record<string, PersistedReview>) {
  const { directory, file } = storePath();
  await mkdir(directory, { recursive: true });
  const temporaryFile = `${file}.${process.pid}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  try {
    await rename(temporaryFile, file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST" && (error as NodeJS.ErrnoException).code !== "EPERM") throw error;
    await rm(file, { force: true });
    await rename(temporaryFile, file);
  }
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