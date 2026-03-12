import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/admin";
export async function requireUid(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) throw new Error("Missing auth token.");
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}
