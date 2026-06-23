import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Higher quality for the final MP4
Config.setCodec("h264");
Config.setCrf(18);
// Concurrency for rendering — increase if your machine has more cores
Config.setConcurrency(4);
