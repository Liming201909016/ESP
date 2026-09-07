# ESP Demo Video Production Guide

**Target duration:** approximately 1:25–1:35; hard maximum 2:00  
**Recording source:** isolated Demo Mode with synthetic data only  
**Primary viewport:** 1440 × 900
**Audio and captions:** English voiceover with English subtitles

## Preflight

1. Run `npm ci` when dependencies changed.
2. Run `npm test`, `npm run evaluate`, and `npm audit --audit-level=moderate`.
3. Run `npm run capture:demo` to refresh five committed screenshots.
4. Run `npm run record:demo` to refresh the two-slide and live-Demo walkthrough.
5. Run `npm run test:media` to validate image dimensions and WebM metadata.
6. Use `npm run prepare:video` to build, generate the picture track and screenshots, synthesize the English voiceover, and validate all assets.
7. Confirm the first visible workspace is `Review` and Recent Reviews is empty.
8. Close notifications, disable browser password prompts, and record at 100% zoom.

The media commands build the application, start an isolated local server, use a temporary empty Review store, and clean it afterward. No historical local or Hosted reviews appear in generated media.

The default first slide is `esp-demo-desktop.png`. To use the supplied ESP architecture overview, add it as `docs/00-Hackathon/assets/esp-overview.png`; the recorder detects it automatically. Slide two is `esp-demo-governance.png`.

## Shot List And Narration

| Time | Workspace / action | Narration |
|---|---|---|
| 0:00–0:05 | Slide 1: ESP overview | “ESP moves enterprise AI from copied agents to governed, reusable capabilities.” |
| 0:05–0:11 | Slide 2: Governance overview | “Employees think in intents. Enterprise capabilities remain scattered. ESP bridges the gap.” |
| 0:11–0:17 | Review workspace | “This public Demo uses synthetic data. A request enters the Review workspace.” |
| 0:17–0:26 | Run `SYN-RG-001` | “The Router validates the Binding and executes five pinned Skills through authorized Plugins.” |
| 0:26–0:35 | Lineage, citation, Evidence | “Every claim resolves to Evidence with versions, citations, and a Correlation ID.” |
| 0:35–0:44 | Risk High; choose Modify | “The analyst changes the proposed rating and creates Human Decision evidence.” |
| 0:44–0:54 | Run `SYN-RG-003` | “Policy denial stops the responsible Skill and Plugin.” |
| 0:54–1:04 | Governance tab | “The control plane shows versions, Bindings, authorization, oversight, and the Pilot boundary.” |
| 1:04–1:14 | Evaluation tab | “Seven synthetic cases pass all 84 mandatory assertions.” |
| 1:14–1:22 | Reuse tab | “Two Consumers resolve the same pinned Skill and Plugins without copied implementation.” |
| 1:22–1:28 | Closing hold | “Build once. Govern once. Reuse everywhere.” |

The source narration is `video/narration-en.txt`. Import `assets/esp-demo-fallback.webm`, `video/voiceover-en.wav`, and `video/subtitles-en.srt` into the editor at time zero. Keep the original audio muted, export at 1440 × 900, and verify the final duration remains below 2:00.

## Demo Data

- Primary success: `SYN-RG-001`
- Policy stop: `SYN-RG-003`
- Optional safety insert: `SYN-APP-002`
- Optional unreadable evidence: `SYN-APP-003`
- Optional dependency failure: `SYN-APP-004`
- Analyst decision: `Modify`, Final risk `High`
- Primary Consumer Binding: `CB-ESP-DEMO-001`
- Reuse Consumer Binding: `CB-ARCH-DEMO-001`

## Editing Notes

- Add cursor emphasis only around citations, analyst decision, governed stop, and reuse proof.
- Use short chapter captions: `Governed execution`, `Evidence`, `Human accountability`, `Controlled stop`, `Evaluation`, `Reuse`.
- Do not caption the Hosted App Service as Production; call it the public Hosted Demo.
- End with the enterprise architecture as a scale-out path, not a completed Connected Mode deployment.