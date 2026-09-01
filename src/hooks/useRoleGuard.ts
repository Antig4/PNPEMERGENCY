import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

/**
 * useRoleGuard
 *
 * Enforces role-based access on a screen.
 * If the user is not authenticated or does not have the required role,
 * they are immediately redirected to the appropriate screen.
 *
 * @param requiredRole - 'CITIZEN' | 'PATROL_OFFICER'
 */
export function useRoleGuard(requiredRole: 'CITIZEN' | 'PATROL_OFFICER') {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      // Not logged in → go to login
      router.replace('/login');
      return;
    }

    if (user.role !== requiredRole) {
      // Wrong role → redirect to their correct home
      if (user.role === 'PATROL_OFFICER') {
        router.replace('/patrol/dashboard');
      } else {
        router.replace('/home');
      }
    }
  }, [isLoading, isAuthenticated, user]);
}
