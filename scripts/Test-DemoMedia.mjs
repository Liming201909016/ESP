import { mkdir, readFile, rm, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const root = resolve(import.meta.dirname, "..");
const assetDirectory = resolve(root, "docs", "00-Hackathon", "assets");
const pngExpectations = new Map([
  ["esp-demo-desktop.png", 1440],
  ["esp-demo-mobile.png", 390],
  ["esp-demo-governance.png", 1440],
  ["esp-demo-reuse.png", 1440],
  ["esp-demo-evaluation.png", 1440],
]);

for (const [name, expectedWidth] of pngExpectations) {
  const file = resolve(assetDirectory, name);
  const contents = await readFile(file);
  if (contents.length < 24 || contents.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`${name} is not a valid PNG`);
  }
  const width = contents.readUInt32BE(16);
  const height = contents.readUInt32BE(20);
  if (width !== expectedWidth || height < 800) {
    throw new Error(`${name} has unexpected dimensions: ${width}x${height}`);
  }
}

const fallbackVideoPath = resolve(assetDirectory, "esp-demo-fallback.webm");
const videoPath = fallbackVideoPath;
const frameDirectory = resolve(root, "artifacts", "demo-recording", "validation-frames");
const fallbackMetadata = await stat(fallbackVideoPath);
if (fallbackMetadata.size < 100_000) throw new Error("Fallback recording is unexpectedly small");

function wavDuration(contents) {
  if (contents.toString("ascii", 0, 4) !== "RIFF" || contents.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Generated voiceover is not a valid WAV file");
  }
  let offset = 12;
  let byteRate;
  let dataSize;
  while (offset + 8 <= contents.length) {
    const chunkId = contents.toString("ascii", offset, offset + 4);
    const chunkSize = contents.readUInt32LE(offset + 4);
    if (chunkId === "fmt ") byteRate = contents.readUInt32LE(offset + 8 + 8);
    if (chunkId === "data") {
      dataSize = chunkSize;
      break;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  if (!byteRate || !dataSize) throw new Error("Generated voiceover WAV metadata is incomplete");
  return dataSize / byteRate;
}

const voiceover = await readFile(resolve(root, "docs", "00-Hackathon", "video", "voiceover-en.wav"));
const voiceoverDuration = wavDuration(voiceover);
if (voiceoverDuration < 70 || voiceoverDuration > 110) {
  throw new Error(`Voiceover duration must be between 70 and 110 seconds: ${voiceoverDuration.toFixed(1)}s`);
}

const subtitles = await readFile(resolve(root, "docs", "00-Hackathon", "video", "subtitles-en.srt"), "utf8");
const subtitleTimes = [...subtitles.matchAll(/-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/g)];
if (!subtitleTimes.length) throw new Error("English subtitles contain no timing cues");
const finalCue = subtitleTimes.at(-1);
const subtitleDuration = Number(finalCue[1]) * 3600 + Number(finalCue[2]) * 60 + Number(finalCue[3]) + Number(finalCue[4]) / 1000;
if (subtitleDuration > 116) throw new Error(`English subtitles exceed the safe video duration: ${subtitleDuration}s`);

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(videoPath).href);
  const video = page.locator("video");
  await video.waitFor();
  const metadata = await video.evaluate((element) => new Promise((resolveMetadata, reject) => {
    const media = element;
    const inspect = () => resolveMetadata({ duration: media.duration, width: media.videoWidth, height: media.videoHeight });
    if (media.readyState >= 1) {
      inspect();
      return;
    }
    media.addEventListener("loadedmetadata", inspect, { once: true });
    media.addEventListener("error", () => reject(new Error("Unable to read fallback recording metadata")), { once: true });
  }));
  if (!Number.isFinite(metadata.duration) || metadata.duration < 85 || metadata.duration > 118 || metadata.width !== 1440 || metadata.height !== 900) {
    throw new Error(`Demo recording metadata is invalid: ${JSON.stringify({ ...metadata, voiceoverDuration, subtitleDuration })}`);
  }
  await rm(frameDirectory, { recursive: true, force: true });
  await mkdir(frameDirectory, { recursive: true });
  for (const [name, time] of [
    ["slide-overview", 2],
    ["slide-governance", 8],
    ["review", 15],
    ["evidence", 30],
    ["governed-stop", 55],
    ["evaluation", 74],
    ["closing-reuse", 82],
  ]) {
    await video.evaluate((element, time) => new Promise((resolveSeek, reject) => {
      const media = element;
      const done = () => resolveSeek();
      media.addEventListener("seeked", done, { once: true });
      media.addEventListener("error", () => reject(new Error("Unable to seek fallback recording")), { once: true });
      media.currentTime = time;
    }), Math.min(time, metadata.duration - 0.5));
    const framePath = resolve(frameDirectory, `${name}.png`);
    await video.screenshot({ path: framePath });
    if ((await stat(framePath)).size < 20_000) throw new Error(`${name} fallback frame is unexpectedly small`);
  }
  console.log(`Demo media: PASS (5 PNGs, WebM ${metadata.width}x${metadata.height}, ${metadata.duration.toFixed(1)}s, voiceover ${voiceoverDuration.toFixed(1)}s, subtitles ${subtitleDuration.toFixed(1)}s, 7 frames)`);
} finally {
  await browser.close();
}