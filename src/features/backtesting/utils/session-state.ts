import { DEFAULT_REPLAY_SPEED_ID } from "../constants";
import type { ReplayState } from "../types";

export function createDefaultReplayState(initialRevealCount: number): ReplayState {
  return {
    replayIndex: Math.max(initialRevealCount - 1, 0),
    isPlaying: false,
    speedId: DEFAULT_REPLAY_SPEED_ID,
  };
}
