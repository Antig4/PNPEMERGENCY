import { Router } from 'expo-router';

export const handleSafeBack = (router: Router, fallbackPath: string = '/home') => {
  try {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackPath as any);
    }
  } catch (e) {
    router.replace(fallbackPath as any);
  }
};
