import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

export function useFirebaseConnection() {
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const connRef = ref(db, '.info/connected');
    return onValue(connRef, (snap) => {
      setConnected(snap.val() === true);
    });
  }, []);

  return connected;
}
