import { useEffect } from 'react';
import { ref, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';

export function usePresence(sessionId, userId, name, collection = 'sessions') {
  useEffect(() => {
    if (!sessionId || !userId || !name) return;

    const memberRef = ref(db, `${collection}/${sessionId}/members/${userId}`);

    set(memberRef, {
      name,
      joinedAt: Date.now(),
      online: true,
    });

    onDisconnect(memberRef).update({ online: false });

    return () => {
      set(memberRef, { name, joinedAt: Date.now(), online: false });
    };
  }, [sessionId, userId, name]);
}
