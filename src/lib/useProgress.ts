import { useEffect, useState } from 'preact/hooks';
import { load, subscribe, type Progress } from './progress';

/** Current progress; null during server render and before hydration. */
export function useProgress(): Progress | null {
  const [p, setP] = useState<Progress | null>(null);
  useEffect(() => {
    setP(load());
    return subscribe(() => setP(load()));
  }, []);
  return p;
}
