import { mkdir, open, readFile, readdir, rename, rm, stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

interface PersistedReview {
  correlationId: string;
  caseId?: string;
  state?: string;
  outcome?: string;
  proposedRisk?: string;
  updatedAt?: string;
  consumerBinding?: { code?: string };
  report?: { status?: string };
  analystDisposition?: { decision?: string; finalRisk?: string };
  lineage?: { status?: string };
  trace?: unknown[];
  evidence?: unknown[];
  [key: string]: unknown;
}

export interface ReviewSummary {
  correlationId: string;
  caseId: string | null;
  state: string | null;
  outcome: string | null;
  updatedAt: string | null;
  consumerBindingCode: string | null;
  reportStatus: string | null;
  analystDecision: string | null;
  proposedRisk: string | null;
  finalRisk: string | null;
  traceCount: number;
  evidenceCount: number;
  lineageStatus: string | null;
}

let writeQueue = Promise.resolve();
const terminalStates = new Set(["Completed", "RejectedByAnalyst", "Escalated", "CannotAssess", "NeedsInformation"]);
const defaultRetentionMs = 7 * 24 * 60 * 60 * 1000;
const defaultMaxStoreBytes = 32 * 1024 * 1024;
const defaultOrphanTempMaxAgeMs = 60 * 60 * 1000;

export class ReviewStoreCapacityError extends Error {
  constructor() {
    super("Review store capacity exceeded");
    this.name = "ReviewStoreCapacityError";
  }
}

function queueStoreOperation<T>(operation: () => Promise<T>) {
  const queued = writeQueue.catch(() => undefined).then(operation);
  writeQueue = queued.then(() => undefined, () => undefined);
  return queued;
}

function storePath() {
  const directory = process.env.ESP_DATA_DIR ?? resolve(process.cwd(), ".esp-data");
  const file = resolve(directory, "reviews.json");
  return { directory, file, backupFile: `${file}.bak` };
}

function configuredNonNegativeNumber(name: string, fallback: number) {
  const configured = Number(process.env[name] ?? fallback);
  return Number.isFinite(configured) && configured >= 0 ? configured : fallback;
}

function maxStoreBytes() {
  return configuredNonNegativeNumber("ESP_REVIEW_STORE_MAX_BYTES", defaultMaxStoreBytes);
}

function orphanTempMaxAgeMs() {
  return configuredNonNegativeNumber("ESP_REVIEW_TEMP_MAX_AGE_MS", defaultOrphanTempMaxAgeMs);
}

async function cleanupOrphanTemporaryFiles(directory: string, now = Date.now()) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
    throw error;
  }

  let removed = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.startsWith("reviews.json.") || !entry.name.endsWith(".tmp")) continue;
    const temporaryFile = resolve(directory, entry.name);
    try {
      const metadata = await stat(temporaryFile);
      if (now - metadata.mtimeMs < orphanTempMaxAgeMs()) continue;
      await rm(temporaryFile, { force: true });
      removed += 1;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return removed;
}

export function cleanupOrphanedReviewStoreFiles(now = Date.now()) {
  return cleanupOrphanTemporaryFiles(storePath().directory, now);
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
  await cleanupOrphanTemporaryFiles(directory);
  const contents = `${JSON.stringify(records, null, 2)}\n`;
  if (Buffer.byteLength(contents, "utf8") > maxStoreBytes()) throw new ReviewStoreCapacityError();
  await replaceFile(file, contents);
  await replaceFile(backupFile, contents);
}

function retentionMs() {
  return configuredNonNegativeNumber("ESP_REVIEW_RETENTION_MS", defaultRetentionMs);
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
  await queueStoreOperation(async () => {
    const records = await readStore();
    removeExpiredTerminalReviews(records, Date.now());
    records[review.correlationId] = { ...review, updatedAt: new Date().toISOString() };
    await writeStore(records);
  });
  return review;
}

export async function loadReview<T extends PersistedReview>(correlationId: string): Promise<T | undefined> {
  await writeQueue;
  return (await readStore())[correlationId] as T | undefined;
}

export async function listReviewSummaries(limit = 10): Promise<ReviewSummary[]> {
  return queueStoreOperation(async () => {
    const records = await readStore();
    const removed = removeExpiredTerminalReviews(records, Date.now());
    if (removed) await writeStore(records);

    return Object.values(records)
      .sort((left, right) => {
        const updatedDifference = Date.parse(right.updatedAt ?? "") - Date.parse(left.updatedAt ?? "");
        return Number.isFinite(updatedDifference) && updatedDifference !== 0
          ? updatedDifference
          : right.correlationId.localeCompare(left.correlationId);
      })
      .slice(0, limit)
      .map((review) => ({
        correlationId: review.correlationId,
        caseId: review.caseId ?? null,
        state: review.state ?? null,
        outcome: review.outcome ?? null,
        updatedAt: review.updatedAt ?? null,
        consumerBindingCode: review.consumerBinding?.code ?? null,
        reportStatus: review.report?.status ?? null,
        analystDecision: review.analystDisposition?.decision ?? null,
        proposedRisk: review.proposedRisk ?? null,
        finalRisk: review.analystDisposition?.finalRisk ?? null,
        traceCount: review.trace?.length ?? 0,
        evidenceCount: review.evidence?.length ?? 0,
        lineageStatus: review.lineage?.status ?? null,
      }));
  });
}

export async function checkReviewStore() {
  await writeQueue;
  const { directory, file } = storePath();
  const orphanTemporaryFilesRemoved = await cleanupOrphanTemporaryFiles(directory);
  const records = await readStore();
  const bytesUsed = await stat(file).then(
    (metadata) => metadata.size,
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return Buffer.byteLength(`${JSON.stringify(records, null, 2)}\n`, "utf8");
      throw error;
    },
  );
  const maximumBytes = maxStoreBytes();
  const withinCapacity = bytesUsed < maximumBytes;
  return {
    status: withinCapacity ? "healthy" as const : "capacity-exceeded" as const,
    backend: "file" as const,
    durableBackup: true,
    capacity: {
      bytesUsed,
      maximumBytes,
      utilization: maximumBytes === 0 ? 1 : Math.round((bytesUsed / maximumBytes) * 10_000) / 10_000,
    },
    orphanTemporaryFilesRemoved,
  };
}

export async function cleanupExpiredReviews(now = Date.now()) {
  let removed = 0;
  await queueStoreOperation(async () => {
    const records = await readStore();
    removed = removeExpiredTerminalReviews(records, now);
    if (removed) await writeStore(records);
  });
  return removed;
}