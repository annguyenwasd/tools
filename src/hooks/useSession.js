import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, update, set, remove } from 'firebase/database';
import { db } from '../firebase';

const TTL_MS = 24 * 60 * 60 * 1000; // 1 day

const PHASES = ['write', 'vote', 'discuss', 'export'];

export function useSession(sessionId, userId) {
  const [meta, setMeta] = useState(null);
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    const metaRef = ref(db, `sessions/${sessionId}/meta`);
    const unsubMeta = onValue(metaRef, (snap) => {
      const data = snap.val();
      if (data && Date.now() - data.createdAt > TTL_MS) {
        remove(ref(db, `sessions/${sessionId}`));
        setMeta(null);
      } else {
        setMeta(data);
      }
      setLoading(false);
    });
    return unsubMeta;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const membersRef = ref(db, `sessions/${sessionId}/members`);
    const unsubMembers = onValue(membersRef, (snap) => {
      setMembers(snap.val() || {});
    });
    return unsubMembers;
  }, [sessionId]);

  // Auto-elect new host if current host goes offline
  useEffect(() => {
    if (!sessionId || !meta || !members || !userId) return;
    const hostId = meta.hostId;
    if (!hostId) return;

    const hostMember = members[hostId];
    const isHostOffline = hostMember && !hostMember.online;
    const amINotHost = hostId !== userId;

    if (isHostOffline && amINotHost) {
      const onlineMembers = Object.entries(members).filter(([, m]) => m.online);
      if (onlineMembers.length === 0) return;
      onlineMembers.sort((a, b) => a[1].joinedAt - b[1].joinedAt);
      const newHostId = onlineMembers[0][0];
      // Only the member with smallest joinedAt should write to avoid race
      const myJoinedAt = members[userId]?.joinedAt;
      const smallestJoinedAt = onlineMembers[0][1].joinedAt;
      if (myJoinedAt === smallestJoinedAt) {
        update(ref(db, `sessions/${sessionId}/meta`), { hostId: newHostId });
      }
    }
  }, [members, meta, sessionId, userId]);

  const advancePhase = useCallback(() => {
    if (!meta) return;
    const currentIndex = PHASES.indexOf(meta.phase);
    if (currentIndex < PHASES.length - 1) {
      update(ref(db, `sessions/${sessionId}/meta`), { phase: PHASES[currentIndex + 1] });
    }
  }, [meta, sessionId]);

  const goToPhase = useCallback((phase) => {
    update(ref(db, `sessions/${sessionId}/meta`), { phase });
  }, [sessionId]);

  const transferHost = useCallback((newHostId) => {
    update(ref(db, `sessions/${sessionId}/meta`), { hostId: newHostId });
  }, [sessionId]);

  const isHost = meta?.hostId === userId;
  const onlineMembers = Object.entries(members).filter(([, m]) => m.online);

  return { meta, members, loading, isHost, onlineMembers, advancePhase, goToPhase, transferHost };
}

export async function createSession(sessionId, hostId, hostName, categories) {
  await set(ref(db, `sessions/${sessionId}/meta`), {
    createdAt: Date.now(),
    phase: 'write',
    categories,
    hostId,
  });
  await set(ref(db, `sessions/${sessionId}/members/${hostId}`), {
    name: hostName,
    joinedAt: Date.now(),
    online: true,
  });
}
