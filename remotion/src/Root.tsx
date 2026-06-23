import { Composition } from "remotion";
import { Main } from "./Main";
import { Sizzle } from "./Sizzle";

/**
 * Main: 50s @ 30fps, 1920x1080 explainer.
 * Sizzle: 13s @ 30fps, 1080x1920 vertical brand launch reel (green brand).
 * SizzleSquare: same content at 1080x1080 for in-feed posting.
 */
export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={1500}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Sizzle"
        component={Sizzle}
        durationInFrames={390}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SizzleSquare"
        component={Sizzle}
        durationInFrames={390}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
