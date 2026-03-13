import { auth } from "./firebase";

async function authedPost(path: string, body: Record<string, any>) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in.");

  const idToken = await user.getIdToken();
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed.");
  return json;
}

export async function authedPostKeepalive(path: string, body: Record<string, any>) {
  const user = auth.currentUser;
  if (!user) return;
  const idToken = await user.getIdToken();

  return fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
}

export const createRoomApi = (body: { name: string }) =>
  authedPost("/api/create-room", body);

export const joinRoomApi = (body: { roomCode: string; name: string }) =>
  authedPost("/api/join-room", body);

export const chooseSeatApi = (body: { roomCode: string; seat: number }) =>
  authedPost("/api/choose-seat", body);

export const placeBetApi = (body: { roomCode: string; amount: number }) =>
  authedPost("/api/place-bet", body);

export const startGameApi = (body: { roomCode: string }) =>
  authedPost("/api/start-game", body);

export const drawCardApi = (body: { roomCode: string }) =>
  authedPost("/api/draw-card", body);

export const endTurnApi = (body: { roomCode: string }) =>
  authedPost("/api/end-turn", body);

export const revealGameApi = (body: { roomCode: string }) =>
  authedPost("/api/reveal-game", body);

export const nextRoundApi = (body: { roomCode: string }) =>
  authedPost("/api/next-round", body);

export const leaveRoomApi = (body: { roomCode: string }) =>
  authedPost("/api/leave-room", body);

export const revealPlayerApi = (body: { roomCode: string; targetUid: string }) =>
  authedPost("/api/reveal-player", body);