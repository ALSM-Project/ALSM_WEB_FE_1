import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api/apiClient';
import { NavigationData } from '../features/menus/types/menu';

const CACHE_KEY = 'alsm_navigation_cache';

function getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function cacheNavigation(data: NavigationData) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore quota error
  }
}

function getCachedNavigation(): NavigationData | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    return null;
  }
}

export function useNavigation() {
  const [navigation, setNavigation] = useState<NavigationData | null>(getCachedNavigation());
  const [loading, setLoading] = useState<boolean>(!getCachedNavigation());
  const [error, setError] = useState<string | null>(null);

  const fetchNavigation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const deviceType = getDeviceType();
      const response = await apiClient.get<{ success: boolean; data: NavigationData }>(
        `/menus/personalized?deviceType=${deviceType}`,
      );

      if (response && response.data) {
        setNavigation(response.data);
        cacheNavigation(response.data);
      }
    } catch (err: any) {
      console.warn('Failed to load navigation from backend, using fallback:', err);
      setError(err.message || 'Failed to load navigation');
      const cached = getCachedNavigation();
      if (cached) {
        setNavigation(cached);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNavigation();
  }, [fetchNavigation]);

  const trackMenuItemUsage = useCallback(async (itemId: string) => {
    try {
      await apiClient.post(`/menus/track/${itemId}`, { action: 'click' });
    } catch (err) {
      console.error('Failed to track menu usage:', err);
    }
  }, []);

  const pinMenuItem = useCallback(
    async (itemId: string) => {
      try {
        await apiClient.post(`/menus/pin/${itemId}`);
        await fetchNavigation();
      } catch (err) {
        console.error('Failed to pin menu item:', err);
      }
    },
    [fetchNavigation],
  );

  const unpinMenuItem = useCallback(
    async (itemId: string) => {
      try {
        await apiClient.post(`/menus/unpin/${itemId}`);
        await fetchNavigation();
      } catch (err) {
        console.error('Failed to unpin menu item:', err);
      }
    },
    [fetchNavigation],
  );

  return {
    navigation,
    loading,
    error,
    trackMenuItemUsage,
    pinMenuItem,
    unpinMenuItem,
    refreshNavigation: fetchNavigation,
  };
}
