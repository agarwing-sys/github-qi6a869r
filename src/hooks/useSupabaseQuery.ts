import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface QueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
  retry?: number;
  retryDelay?: number;
}

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

// Cache global simple
const queryCache = new Map<string, {
  data: any;
  timestamp: number;
  staleTime: number;
}>();

export function useSupabaseQuery<T>(
  queryKey: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    retry = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Vérifier le cache
  const getCachedData = useCallback(() => {
    const cached = queryCache.get(queryKey);
    if (cached && Date.now() - cached.timestamp < cached.staleTime) {
      return cached.data;
    }
    return null;
  }, [queryKey]);

  // Mettre en cache
  const setCachedData = useCallback((newData: T) => {
    queryCache.set(queryKey, {
      data: newData,
      timestamp: Date.now(),
      staleTime
    });
  }, [queryKey, staleTime]);

  const executeQuery = useCallback(async (isRefetch = false) => {
    if (!enabled && !isRefetch) return;

    // Vérifier le cache d'abord
    const cachedData = getCachedData();
    if (cachedData && !isRefetch) {
      setData(cachedData);
      setLoading(false);
      setError(null);
      return;
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      
      if (result.error) {
        throw new Error(result.error.message || 'Une erreur est survenue');
      }

      setData(result.data);
      if (result.data) {
        setCachedData(result.data);
      }
      setIsStale(false);
      retryCountRef.current = 0;
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      
      console.error(`Query error for ${queryKey}:`, err);
      
      // Retry logic
      if (retryCountRef.current < retry) {
        retryCountRef.current++;
        setTimeout(() => {
          executeQuery(isRefetch);
        }, retryDelay * retryCountRef.current);
        return;
      }
      
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [enabled, queryKey, queryFn, getCachedData, setCachedData, retry, retryDelay]);

  const refetch = useCallback(() => executeQuery(true), [executeQuery]);

  // Effet principal
  useEffect(() => {
    executeQuery();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [executeQuery]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      const cached = queryCache.get(queryKey);
      if (cached && Date.now() - cached.timestamp > staleTime) {
        setIsStale(true);
        refetch();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, queryKey, staleTime, refetch]);

  return { data, loading, error, refetch, isStale };
}

// Hook pour les mutations
export function useSupabaseMutation<T, V>(
  mutationFn: (variables: V) => Promise<{ data: T | null; error: any }>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[];
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (variables: V) => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      
      if (result.error) {
        throw new Error(result.error.message || 'Une erreur est survenue');
      }

      // Invalider les queries spécifiées
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryCache.delete(queryKey);
        });
      }

      if (result.data && options.onSuccess) {
        options.onSuccess(result.data);
      }

      return result.data;
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (options.onError) {
        options.onError(error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options]);

  return { mutate, loading, error };
}