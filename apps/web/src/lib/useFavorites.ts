'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth';

interface FavoriteItem {
  restaurantId: string;
}

/** Shared favorites state: the set of saved restaurant ids and a toggle. */
export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => apiFetch<FavoriteItem[]>('/favorites'),
    enabled: !!user,
  });

  const favoriteIds = new Set((data ?? []).map((f) => f.restaurantId));

  const toggle = useMutation({
    mutationFn: ({ restaurantId, on }: { restaurantId: string; on: boolean }) =>
      apiFetch(`/favorites/${restaurantId}`, { method: on ? 'POST' : 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  return {
    enabled: !!user,
    favoriteIds,
    toggleFavorite: (restaurantId: string) =>
      toggle.mutate({ restaurantId, on: !favoriteIds.has(restaurantId) }),
  };
}
