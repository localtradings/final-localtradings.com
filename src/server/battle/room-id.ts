import "server-only";

const LOBBY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LOBBY_CODE_LENGTH = 6;

export function createBattleRoomId() {
  return crypto.randomUUID();
}

export function createBattleLobbyCode() {
  const values = crypto.getRandomValues(new Uint32Array(LOBBY_CODE_LENGTH));

  return Array.from(values)
    .map((value) => LOBBY_CODE_ALPHABET[value % LOBBY_CODE_ALPHABET.length])
    .join("");
}
