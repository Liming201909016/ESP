import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { generateCandidateResults } from "./evaluation.js";

const outputPath = resolve(process.argv[2] ?? "artifacts/evaluation-runs/app-candidate-results.json");
await mkdir(resolve(outputPath, ".."), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(await generateCandidateResults(), null, 2)}\n`, "utf8");
console.log(`Application candidate results: ${outputPath}`);