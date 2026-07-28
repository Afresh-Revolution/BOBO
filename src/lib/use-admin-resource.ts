"use client";

import { useCallback, useEffect, useState } from "react";

type UseAdminResourceOptions<T> = {
  load: () => Promise<T>;
  deps?: unknown[];
  initial?: T;
  mapError?: (err: unknown) => string;
};

export function useAdminResource<T>({
  load,
  deps = [],
  initial,
  mapError = (err) =>
    err instanceof Error ? err.message : "Request failed",
}: UseAdminResourceOptions<T>) {
  const [data, setData] = useState<T | undefined>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const next = await load();
          if (!cancelled) setData(next);
        } catch (err) {
          if (!cancelled) {
            setError(mapError(err));
            if (initial !== undefined) setData(initial);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps provided by caller
  }, [tick, ...deps]);

  return { data, loading, error, setError, setData, reload };
}
