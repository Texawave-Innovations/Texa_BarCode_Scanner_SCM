import { useCallback, useEffect, useState } from 'react';
import { loadSnapshot } from './data';
import type { Snapshot } from './types';

/** Loads fresh warehouse data when the screen mounts (and on demand via reload) so stock
 *  figures and validation never rely on a stale cache. */
export function useSnapshot() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      setError(null);
      const s = await loadSnapshot();
      setSnap(s);
      return s;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load data. Check your connection.');
      return null;
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { snap, error, reload };
}
