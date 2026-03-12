const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onValueWritten } = require("firebase-functions/v2/database");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

initializeApp();

const EMPTY_ROOM_GRACE_MS = 10_000; // 10s grace period before deleting

/**
 * Daily cleanup at midnight — removes sessions older than 24 hours.
 */
exports.dailyCleanup = onSchedule("0 0 * * *", async () => {
  const db = getDatabase();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  const [retroSnap, pokerSnap] = await Promise.all([
    db.ref("sessions").orderByChild("meta/createdAt").endAt(cutoff).once("value"),
    db.ref("poker").orderByChild("meta/createdAt").endAt(cutoff).once("value"),
  ]);

  const deletes = {};
  retroSnap.forEach((s) => { deletes[`sessions/${s.key}`] = null; });
  pokerSnap.forEach((s) => { deletes[`poker/${s.key}`] = null; });

  if (Object.keys(deletes).length) {
    await db.ref().update(deletes);
    console.log("Deleted stale sessions:", Object.keys(deletes));
  }
});

/**
 * Delete a retro session when all members go offline.
 */
exports.cleanupEmptyRetroSession = onValueWritten(
  { ref: "sessions/{sessionId}/members/{userId}/online", instance: "tools-7d4ed-default-rtdb", region: "asia-southeast1" },
  async (event) => {
    const { sessionId } = event.params;
    await maybeDeleteSession("sessions", sessionId);
  }
);

/**
 * Delete a poker session when all members go offline.
 */
exports.cleanupEmptyPokerSession = onValueWritten(
  { ref: "poker/{sessionId}/members/{userId}/online", instance: "tools-7d4ed-default-rtdb", region: "asia-southeast1" },
  async (event) => {
    const { sessionId } = event.params;
    await maybeDeleteSession("poker", sessionId);
  }
);

async function maybeDeleteSession(collection, sessionId) {
  const db = getDatabase();
  const membersRef = db.ref(`${collection}/${sessionId}/members`);

  const snap = await membersRef.once("value");
  const members = snap.val() ?? {};
  const anyOnline = Object.values(members).some((m) => m.online);
  if (anyOnline) return;

  // Grace period — wait for reconnects before deleting
  await new Promise((r) => setTimeout(r, EMPTY_ROOM_GRACE_MS));

  const recheck = await membersRef.once("value");
  const stillOnline = Object.values(recheck.val() ?? {}).some((m) => m.online);
  if (!stillOnline) {
    await db.ref(`${collection}/${sessionId}`).remove();
    console.log(`Deleted empty session: ${collection}/${sessionId}`);
  }
}
