import { signInAnonymously } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "./firebase";
export async function ensureAnonymousAuth(displayName?: string) {
  if (!auth.currentUser) await signInAnonymously(auth);
  if (auth.currentUser) {
    await set(ref(db, `users/${auth.currentUser.uid}`), { displayName: displayName || "Player", lastSeenAt: Date.now() });
  }
  return auth.currentUser;
}
