import { rm } from "node:fs/promises";

export default async function teardownE2EData() {
  const dataDirectory = process.env.ESP_E2E_DATA_DIR;
  if (dataDirectory) await rm(dataDirectory, { recursive: true, force: true });
}