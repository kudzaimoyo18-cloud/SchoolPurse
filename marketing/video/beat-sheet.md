# SchoolPurse Launch Reel — Beat Sheet (for syncing trending audio)

**Files:** `marketing/video/schoolpurse-launch-reel.mp4` (1080x1920, 9:16) · `schoolpurse-launch-reel-square.mp4` (1080x1080)
**Length:** 13.0s · 30fps · silent (designed for added audio)

## Why silent
IG/Reels autoplay muted and rank native/trending audio. Add a trending track *in-app* after upload so the algorithm favours it — that is why no music is baked in.

## How to use this sheet
Pick a track with energy hits near **3.0s** (the transition) and **10.0s** (the CTA drop). In the IG editor, align the track first strong beat to 0.0s, then nudge so the drop lands on a marker below.

## Beat markers (seconds)
| Time | Frame | What happens | Sync target |
|------|-------|--------------|-------------|
| 0.00 | 0   | Brand mark pops in | track start / soft intro |
| 0.53 | 16  | "SchoolPurse" wordmark | - |
| 1.00 | 30  | Subtitle "Fee tracking for Zimbabwean schools" | - |
| 2.60-3.00 | 78-90 | Logo exits -> cut to features | **beat hit / transition** |
| 3.33 | 100 | Line: "Track every fee." | beat |
| 4.33 | 130 | Line: "Issue every receipt." | beat |
| 5.50 | 165 | Line: "See every report." | beat |
| 5.7-9.9 | 170-296 | Three lines hold (readable) | sustained / build |
| 10.00 | 300 | CTA drops in (mark + wordmark) | **biggest beat / drop** |
| 10.40 | 312 | "Sign in - link in bio" pill | accent |
| 10.73 | 322 | "@SchoolPursezw" handle | accent |
| 13.00 | 390 | End | outro / loop point |

## Track selection tips (Zimbabwe / IG)
- Use IG trending audio panel (arrow-up icon) - pick a rising track, not a peaked one.
- Afrobeats / amapiano with a clear ~3s build + ~10s drop fits the cut.
- Keep it instrumental or low-lyric so on-screen captions stay the message.
- 13s loops cleanly for an auto-repeating Reel.

## To bake audio in instead
Remotion supports it: drop a licensed mp3 in `remotion/out/`, add an `<Audio>` tag to `Sizzle.tsx`, re-render. Say the word and I will wire it.
