# SchoolPurse explainer video

A 60-second 1080p animated explainer built with [Remotion](https://www.remotion.dev).

## Run locally

```bash
cd remotion
npm install
npm run dev          # opens Remotion Studio for live preview
```

## Render to MP4

```bash
npm run render       # outputs out/schoolpurse-explainer.mp4
npm run render:hq    # higher-bitrate variant (crf 14)
```

The first render downloads a small Chromium build (~80 MB) for headless
frame capture and pulls in ffmpeg via `@remotion/renderer`. Subsequent
renders reuse both.

## Storyboard

| Scene | Frames | Time | Beat |
|---|---|---|---|
| Hook | 0–120 | 0–4s | "Running a school takes work." |
| Problem 1 | 120–330 | 4–11s | Tracking the money is harder |
| Problem 2 | 330–540 | 11–18s | Cash, paper, scribbled notes |
| Problem 3 | 540–720 | 18–24s | Arrears unknown, slow reports |
| Transition | 720–840 | 24–28s | "There's a better way" |
| Reveal | 840–1020 | 28–34s | SchoolPurse logo |
| Feature 1 | 1020–1230 | 34–41s | Record cash, print receipt |
| Feature 2 | 1230–1440 | 41–48s | Arrears at a glance |
| Feature 3 | 1440–1620 | 48–54s | Receipts on demand |
| Closing | 1620–1800 | 54–60s | Logo + schoolpurse.app |

No price is shown anywhere in the video — it's a pure problem-solution piece.
