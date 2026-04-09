/**
 * hooks/useActor.ts
 *
 * Provides the backend actor to React components via React Query.
 * The actor is initialized once and reused across all components.
 * No Internet Identity — actor is always anonymous (admin auth is
 * handled via canister method verifyAdminLogin with username/password).
 */

import { useQuery } from "@tanstack/react-query";
import { type BackendActor, createActorWithConfig } from "../config";

export function useActor(): {
  actor: BackendActor | null;
  isFetching: boolean;
} {
  const { data, isFetching } = useQuery<BackendActor>({
    queryKey: ["backend-actor"],
    queryFn: () => createActorWithConfig(),
    // Actor never changes — create once and cache forever
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: 3,
    retryDelay: 1000,
  });

  return {
    actor: data ?? null,
    isFetching,
  };
}
