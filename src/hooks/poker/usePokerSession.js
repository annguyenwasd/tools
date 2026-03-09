import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, update, set, remove } from 'firebase/database';
import { db } from '../../firebase';

const TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export function usePokerSession(sessionId, userId) {
  const [meta, setMeta] = useState(null);
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    const metaRef = ref(db, `poker/${sessionId}/meta`);
    return onValue(metaRef, (snap) => {
      const data = snap.val();
      if (data && Date.now() - data.createdAt > TTL_MS) {
        remove(ref(db, `poker/${sessionId}`));
        setMeta(null);
      } else {
        setMeta(data);
      }
      setLoading(false);
    });
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const membersRef = ref(db, `poker/${sessionId}/members`);
    return onValue(membersRef, (snap) => {
      setMembers(snap.val() || {});
    });
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
      const onlineList = Object.entries(members).filter(([, m]) => m.online);
      if (onlineList.length === 0) return;
      onlineList.sort((a, b) => a[1].joinedAt - b[1].joinedAt);
      const newHostId = onlineList[0][0];
      const myJoinedAt = members[userId]?.joinedAt;
      const smallestJoinedAt = onlineList[0][1].joinedAt;
      if (myJoinedAt === smallestJoinedAt) {
        update(ref(db, `poker/${sessionId}/meta`), { hostId: newHostId });
      }
    }
  }, [members, meta, sessionId, userId]);

  const selectStory = useCallback((storyId) => {
    update(ref(db, `poker/${sessionId}/meta`), { currentStoryId: storyId, revealed: false });
  }, [sessionId]);

  const revealVotes = useCallback(() => {
    update(ref(db, `poker/${sessionId}/meta`), { revealed: true });
  }, [sessionId]);

  const restartVote = useCallback(() => {
    update(ref(db, `poker/${sessionId}/meta`), { revealed: false });
  }, [sessionId]);

  const transferHost = useCallback((newHostId) => {
    update(ref(db, `poker/${sessionId}/meta`), { hostId: newHostId });
  }, [sessionId]);

  const isHost = meta?.hostId === userId;
  const onlineMembers = Object.entries(members).filter(([, m]) => m.online);

  return { meta, members, loading, isHost, onlineMembers, selectStory, revealVotes, restartVote, transferHost };
}

export async function createPokerSession(sessionId, hostId, hostName, cardSet) {
  await set(ref(db, `poker/${sessionId}/meta`), {
    createdAt: Date.now(),
    hostId,
    currentStoryId: null,
    revealed: false,
    cardSet,
  });
  await set(ref(db, `poker/${sessionId}/members/${hostId}`), {
    name: hostName,
    joinedAt: Date.now(),
    online: true,
  });
}
