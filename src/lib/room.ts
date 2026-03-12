import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { RoomData } from "./types";
export function subscribeRoom(roomCode: string, callback: (room: RoomData | null) => void) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  return onValue(roomRef, (snapshot) => callback(snapshot.exists() ? (snapshot.val() as RoomData) : null));
}
