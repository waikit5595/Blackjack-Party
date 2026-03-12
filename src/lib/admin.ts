import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getAuth } from "firebase-admin/auth";
function getPrivateKey() { return (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"); }
const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: getPrivateKey(),
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});
export const adminDb = getDatabase(adminApp);
export const adminAuth = getAuth(adminApp);
