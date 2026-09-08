import { access, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const videoDirectory = resolve(root, "docs", "00-Hackathon", "video");
const pictureTrack = resolve(root, "docs", "00-Hackathon", "assets", "esp-demo-fallback.webm");
const voiceover = resolve(videoDirectory, "voiceover-en.wav");
const subtitles = resolve(videoDirectory, "subtitles-en.srt");
const output = resolve(videoDirectory, "ESP-Hackathon-2026-Demo.mp4");

async function firstAvailable(candidates) {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next configured or repository-local encoder.
    }
  }
  return "ffmpeg";
}

async function run(command, args) {
  await new Promise((resolveRun, reject) => {
    const process = spawn(command, args, { cwd: videoDirectory, stdio: "inherit" });
    process.on("error", reject);
    process.on("exit", (code) => {
      if (code === 0) resolveRun();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });
}

for (const input of [pictureTrack, voiceover, subtitles]) await access(input);

const ffmpeg = await firstAvailable([
  process.env.FFMPEG_PATH,
  resolve(root, "node_modules", "@ffmpeg-installer", "win32-x64", "ffmpeg.exe"),
].filter(Boolean));

const subtitleFilter = [
  "subtitles=subtitles-en.srt:original_size=1440x900:force_style='FontName=Segoe UI",
  "FontSize=13,PrimaryColour=&H00FFFFFF,OutlineColour=&HCC000000",
  "BackColour=&H78000000,BorderStyle=3,Outline=1,Shadow=0",
  "MarginL=30,MarginR=30,MarginV=12,Alignment=2'",
].join(",");

await run(ffmpeg, [
  "-y",
  "-hide_banner",
  "-i", pictureTrack,
  "-i", voiceover,
  "-map", "0:v:0",
  "-map", "1:a:0",
  "-vf", subtitleFilter,
  "-af", "apad",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "22",
  "-profile:v", "high",
  "-level", "4.1",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-b:a", "160k",
  "-ar", "48000",
  "-ac", "2",
  "-shortest",
  "-movflags", "+faststart",
  "-metadata", "title=Enterprise Skill Platform - Hackathon 2026 Demo",
  "-metadata", "comment=Synthetic Demo Mode data only",
  output,
]);

const metadata = await stat(output);
if (metadata.size < 1_000_000) throw new Error(`Upload video is unexpectedly small: ${metadata.size} bytes`);
console.log(`Upload video: PASS (${output}, ${(metadata.size / 1_000_000).toFixed(1)} MB)`);