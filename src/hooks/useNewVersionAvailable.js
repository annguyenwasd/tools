import { useEffect, useState } from 'react';

const POLL_INTERVAL = 5 * 60 * 1000; // check every 5 minutes

async function fetchEtag() {
  try {
    const res = await fetch('/index.html', { method: 'HEAD', cache: 'no-store' });
    return res.headers.get('etag') || res.headers.get('last-modified') || null;
  } catch {
    return null;
  }
}

export function useNewVersionAvailable() {
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);

  useEffect(() => {
    let baseline = null;

    const check = async () => {
      const tag = await fetchEtag();
      if (!tag) return;
      if (baseline === null) { baseline = tag; return; }
      if (tag !== baseline) setNewVersionAvailable(true);
    };

    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return newVersionAvailable;
}
