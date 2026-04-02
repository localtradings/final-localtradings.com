import { describe, expect, it } from "vitest";

import { createDefaultReplayState } from "@/features/backtesting/utils/session-state";

describe("session-state", () => {
  it("creates a default replay state from the reveal count", () => {
    expect(createDefaultReplayState(250)).toEqual({
      replayIndex: 249,
      isPlaying: false,
      speedId: "2x",
    });
  });
});
