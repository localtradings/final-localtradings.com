import { describe, expect, it, vi } from "vitest";

import { BattleMatchmakerDO } from "./matchmaker";

describe("BattleMatchmakerDO", () => {
  it("serializes public join requests through blockConcurrencyWhile", async () => {
    const blockConcurrencyWhile = vi.fn(async (callback: () => Promise<Response>) => callback());
    const roomFetch = vi.fn(async () =>
      Response.json({
        ok: true,
        data: {
          room: {
            roomId: "room-1",
          },
        },
      }),
    );

    const matchmaker = new BattleMatchmakerDO(
      {
        blockConcurrencyWhile,
        storage: {
          get: vi.fn(async () => ({
            publicRoomIds: [],
            privateCodes: {},
          })),
          put: vi.fn(async () => undefined),
        },
      } as never,
      {
        BATTLE_ROOM: {
          idFromName: (value: string) => value,
          get: () => ({
            fetch: roomFetch,
          }),
        },
      } as never,
    );

    const response = await matchmaker.fetch(new Request("https://battle-matchmaker/public/join", {
      method: "POST",
      body: JSON.stringify({
        roomId: "room-1",
        userId: "user-1",
        displayName: "Queue Tester",
      }),
    }));

    expect(blockConcurrencyWhile).toHaveBeenCalledTimes(1);
    expect(roomFetch).toHaveBeenCalledTimes(1);
    expect(response.ok).toBe(true);
  });
});
