import { useMemo, useRef } from 'react';
import { ListeningEntry } from '../models/listeningEntry';

interface CacheEntry<T> {
  key: string;
  value: T;
}

export function useStatsCache<T>(
  calculate: (entries: ListeningEntry[]) => T,
  entries: ListeningEntry[],
  since: Date,
  to: Date,
  additionalDeps: any[] = []
): T {
  const cacheRef = useRef<Map<string, T>>(new Map());

  return useMemo(() => {
    // Create a cache key based on date range, entry count, and additional deps
    const additionalKey = additionalDeps.length > 0 ? `-${JSON.stringify(additionalDeps)}` : '';
    const cacheKey = `${since.getTime()}-${to.getTime()}-${entries.length}${additionalKey}`;

    // Check if we have a cached result
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey)!;
    }

    // Calculate and cache the result
    const result = calculate(entries);
    cacheRef.current.set(cacheKey, result);

    // Limit cache size to prevent memory leaks (keep last 10 calculations)
    if (cacheRef.current.size > 10) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }

    return result;
  }, [entries.length, since.getTime(), to.getTime(), ...additionalDeps]);
}
