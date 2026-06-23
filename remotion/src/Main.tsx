import { Series } from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";
import { SceneHook } from "./scenes/SceneHook";
import { SceneProblem1 } from "./scenes/SceneProblem1";
import { SceneProblem2 } from "./scenes/SceneProblem2";
import { SceneProblem3 } from "./scenes/SceneProblem3";
import { SceneTransition } from "./scenes/SceneTransition";
import { SceneReveal } from "./scenes/SceneReveal";
import { SceneFeaturePayments } from "./scenes/SceneFeaturePayments";
import { SceneFeatureArrears } from "./scenes/SceneFeatureArrears";
import { SceneFeatureReceipts } from "./scenes/SceneFeatureReceipts";
import { SceneClosing } from "./scenes/SceneClosing";

// Load DM Sans so it matches the live product typography.
loadFont();

/**
 * Tightened 50s storyboard (30fps = 1500 frames). Each scene runs ~30 frames
 * (1s) shorter than the original 60s cut so the pace stays punchy and the
 * VO has clean room to breathe without dead air at scene ends.
 *
 *    0  -  90 (0-3s)     Hook
 *   90 - 270 (3-9s)      Problem 1
 *  270 - 450 (9-15s)     Problem 2
 *  450 - 600 (15-20s)    Problem 3
 *  600 - 690 (20-23s)    Transition
 *  690 - 840 (23-28s)    Brand reveal
 *  840 - 1020 (28-34s)   Feature 1 — payments
 * 1020 - 1200 (34-40s)   Feature 2 — arrears
 * 1200 - 1350 (40-45s)   Feature 3 — receipts
 * 1350 - 1500 (45-50s)   Closing CTA
 */
export const Main: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={90}>
        <SceneHook />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <SceneProblem1 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <SceneProblem2 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={150}>
        <SceneProblem3 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={90}>
        <SceneTransition />
      </Series.Sequence>
      <Series.Sequence durationInFrames={150}>
        <SceneReveal />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <SceneFeaturePayments />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <SceneFeatureArrears />
      </Series.Sequence>
      <Series.Sequence durationInFrames={150}>
        <SceneFeatureReceipts />
      </Series.Sequence>
      <Series.Sequence durationInFrames={150}>
        <SceneClosing />
      </Series.Sequence>
    </Series>
  );
};
