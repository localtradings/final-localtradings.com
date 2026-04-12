import type { DurableObjectState } from "@cloudflare/workers-types";

type Env = {
  BATTLE_ROOM: DurableObjectNamespace;
};

type WaitingState = {
  publicRoomIds: string[];
  privateCodes: Record<string, string>;
};

export class BattleMatchmakerDO {
  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Env,
  ) {}

  async fetch(request: Request) {
    const url = new URL(request.url);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

    if (url.pathname === "/public/join") {
      return this.state.blockConcurrencyWhile(() => this.handleJoinPublic(body));
    }
    if (url.pathname === "/private/create") {
      return this.state.blockConcurrencyWhile(() => this.handleCreatePrivate(body));
    }
    if (url.pathname === "/private/join") {
      return this.state.blockConcurrencyWhile(() => this.handleJoinPrivate(body));
    }

    return Response.json(
      { ok: false, reason: "matchmaker_route_not_found", message: "Battle matchmaker route not found." },
      { status: 404 },
    );
  }

  private async getWaitingState() {
    return (
      (await this.state.storage.get<WaitingState>("waiting")) ?? {
        publicRoomIds: [],
        privateCodes: {},
      }
    );
  }

  private async saveWaitingState(waiting: WaitingState) {
    await this.state.storage.put("waiting", waiting);
  }

  private getRoomStub(roomId: string) {
    return this.env.BATTLE_ROOM.get(this.env.BATTLE_ROOM.idFromName(roomId));
  }

  private async handleJoinPublic(body: Record<string, unknown> | null) {
    if (!body) {
      return Response.json(
        { ok: false, reason: "invalid_payload", message: "Missing public join payload." },
        { status: 400 },
      );
    }

    const waiting = await this.getWaitingState();
    const now = new Date().toISOString();
    const roomId = String(body.roomId);
    const payload = {
      roomId,
      lobbyCode: null,
      roomType: "public",
      durationMinutes: 15,
      maxPlayers: 5,
      riskLimitPercent: 2,
      maxDrawdownPercent: 10,
      userId: String(body.userId),
      displayName: String(body.displayName),
    };

    const stillWaitingRoomIds: string[] = [];
    for (const waitingRoomId of waiting.publicRoomIds) {
      const stub = this.getRoomStub(waitingRoomId);
      const joinResponse = await stub.fetch("https://battle-room/join", {
        method: "POST",
        body: JSON.stringify({
          userId: payload.userId,
          displayName: payload.displayName,
          joinedAt: now,
        }),
      });
      const joinPayload = (await joinResponse.json()) as { ok: boolean; data?: unknown; reason?: string };
      if (joinPayload.ok) {
        stillWaitingRoomIds.push(waitingRoomId);
        waiting.publicRoomIds = stillWaitingRoomIds;
        await this.saveWaitingState(waiting);
        return Response.json({ ok: true, data: joinPayload.data });
      }

      if (joinPayload.reason !== "room_already_started" && joinPayload.reason !== "room_not_found") {
        stillWaitingRoomIds.push(waitingRoomId);
      }
    }

    const stub = this.getRoomStub(roomId);
    const createResponse = await stub.fetch("https://battle-room/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const createPayload = await createResponse.json();
    waiting.publicRoomIds = [roomId, ...stillWaitingRoomIds.filter((id) => id !== roomId)];
    await this.saveWaitingState(waiting);
    return Response.json(createPayload);
  }

  private async handleCreatePrivate(body: Record<string, unknown> | null) {
    if (!body) {
      return Response.json(
        { ok: false, reason: "invalid_payload", message: "Missing private room payload." },
        { status: 400 },
      );
    }

    const waiting = await this.getWaitingState();
    const stub = this.getRoomStub(String(body.roomId));
    const createResponse = await stub.fetch("https://battle-room/create", {
      method: "POST",
      body: JSON.stringify({
        roomId: body.roomId,
        lobbyCode: body.lobbyCode,
        roomType: "private",
        durationMinutes: body.durationMinutes,
        maxPlayers: body.maxPlayers,
        userId: body.userId,
        displayName: body.displayName,
      }),
    });
    const createPayload = await createResponse.json();
    if ((createPayload as { ok?: boolean }).ok && typeof body.lobbyCode === "string") {
      waiting.privateCodes[String(body.lobbyCode)] = String(body.roomId);
      await this.saveWaitingState(waiting);
    }
    return Response.json(createPayload);
  }

  private async handleJoinPrivate(body: Record<string, unknown> | null) {
    if (!body || typeof body.lobbyCode !== "string") {
      return Response.json(
        { ok: false, reason: "invalid_lobby_code", message: "Invalid lobby code." },
        { status: 400 },
      );
    }

    const waiting = await this.getWaitingState();
    const roomId = waiting.privateCodes[String(body.lobbyCode)];
    if (!roomId) {
      return Response.json(
        { ok: false, reason: "room_not_found", message: "Private battle room not found." },
        { status: 404 },
      );
    }

    const stub = this.getRoomStub(roomId);
    const joinResponse = await stub.fetch("https://battle-room/join", {
      method: "POST",
      body: JSON.stringify({
        userId: body.userId,
        displayName: body.displayName,
      }),
    });

    const joinPayload = await joinResponse.json();
    if (
      typeof joinPayload === "object" &&
      joinPayload &&
      "ok" in joinPayload &&
      !joinPayload.ok &&
      "reason" in joinPayload &&
      (joinPayload.reason === "room_already_started" || joinPayload.reason === "room_not_found")
    ) {
      delete waiting.privateCodes[String(body.lobbyCode)];
      await this.saveWaitingState(waiting);
    }

    return Response.json(joinPayload);
  }
}
