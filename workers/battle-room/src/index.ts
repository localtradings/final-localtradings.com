import { BattleMatchmakerDO } from "./matchmaker";
import { BattleRoomDO } from "./room";

type Env = {
  APP_BASE_URL: string;
  BATTLE_SHARED_SECRET: string;
  BATTLE_MATCHMAKER: DurableObjectNamespace;
  BATTLE_ROOM: DurableObjectNamespace;
};

function unauthorized() {
  return Response.json(
    { ok: false, reason: "unauthorized", message: "Battle worker secret mismatch." },
    { status: 401 },
  );
}

function withInternalSecret(request: Request, env: Env) {
  return request.headers.get("x-battle-internal-secret") === env.BATTLE_SHARED_SECRET;
}

const battleWorker = {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      const roomId = url.searchParams.get("roomId");
      if (!roomId) {
        return Response.json(
          { ok: false, reason: "invalid_payload", message: "Battle room id is required." },
          { status: 400 },
        );
      }

      const stub = env.BATTLE_ROOM.get(env.BATTLE_ROOM.idFromName(roomId));
      return stub.fetch(request);
    }

    if (!withInternalSecret(request, env)) {
      return unauthorized();
    }

    const body = await request.json().catch(() => null);

    if (url.pathname === "/internal/public/join") {
      const stub = env.BATTLE_MATCHMAKER.get(env.BATTLE_MATCHMAKER.idFromName("matchmaker"));
      return stub.fetch("https://battle-matchmaker/public/join", {
        method: "POST",
        body: JSON.stringify(body),
      });
    }

    if (url.pathname === "/internal/private/create") {
      const stub = env.BATTLE_MATCHMAKER.get(env.BATTLE_MATCHMAKER.idFromName("matchmaker"));
      const createBody = body && typeof body === "object" ? body : {};
      return stub.fetch("https://battle-matchmaker/private/create", {
        method: "POST",
        body: JSON.stringify({
          ...createBody,
          lobbyCode: crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase(),
        }),
      });
    }

    if (url.pathname === "/internal/private/join") {
      const stub = env.BATTLE_MATCHMAKER.get(env.BATTLE_MATCHMAKER.idFromName("matchmaker"));
      return stub.fetch("https://battle-matchmaker/private/join", {
        method: "POST",
        body: JSON.stringify(body),
      });
    }

    if (url.pathname === "/internal/rooms/create" || url.pathname === "/internal/rooms/join") {
      const roomId =
        typeof body === "object" && body && "roomId" in body ? String(body.roomId) : null;
      if (!roomId) {
        return Response.json(
          { ok: false, reason: "invalid_payload", message: "Battle room id is required." },
          { status: 400 },
        );
      }

      const stub = env.BATTLE_ROOM.get(env.BATTLE_ROOM.idFromName(roomId));
      return stub.fetch(
        url.pathname === "/internal/rooms/create" ? "https://battle-room/create" : "https://battle-room/join",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
    }

    const roomId =
      typeof body === "object" && body && "roomId" in body ? String(body.roomId) : null;
    if (!roomId) {
      return Response.json(
        { ok: false, reason: "invalid_payload", message: "Battle room id is required." },
        { status: 400 },
      );
    }

    const stub = env.BATTLE_ROOM.get(env.BATTLE_ROOM.idFromName(roomId));
    if (url.pathname === "/internal/rooms/state") {
      return stub.fetch("https://battle-room/state", {
        method: "POST",
        body: JSON.stringify(body),
      });
    }
    if (url.pathname === "/internal/rooms/ready") {
      return stub.fetch("https://battle-room/ready", {
        method: "POST",
        body: JSON.stringify(body),
      });
    }
    if (url.pathname === "/internal/rooms/leave") {
      return stub.fetch("https://battle-room/leave", {
        method: "POST",
        body: JSON.stringify(body),
      });
    }
    if (url.pathname === "/internal/rooms/open-trade") {
      return stub.fetch("https://battle-room/open-trade", {
        method: "POST",
        body: JSON.stringify(body),
      });
    }
    if (url.pathname === "/internal/rooms/sync-replay") {
      return stub.fetch("https://battle-room/sync-replay", {
        method: "POST",
        body: JSON.stringify(body),
      });
    }
    if (url.pathname === "/internal/rooms/close-trade") {
      return stub.fetch("https://battle-room/close-trade", {
        method: "POST",
        body: JSON.stringify(body),
      });
    }

    return Response.json(
      { ok: false, reason: "route_not_found", message: "Battle worker route not found." },
      { status: 404 },
    );
  },
};

export default battleWorker;
export { BattleMatchmakerDO, BattleRoomDO };
