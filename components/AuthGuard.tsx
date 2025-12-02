import { router, useSegments, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Wait for auth to finish loading
    }

    // Check if we're on a protected route
    const isProtectedRoute = 
      segments[0] === '(tabs)' || 
      pathname?.startsWith('/view-prayer') ||
      pathname?.startsWith('/completed-event') ||
      pathname?.startsWith('/live-stream');

    const isLoginRoute = pathname === '/login' || segments[0] === 'login';

    if (!user && isProtectedRoute) {
      // User is not authenticated but trying to access protected route
      console.log('[AuthGuard] Redirecting to login - user not authenticated');
      router.replace('/login');
    } else if (user && isLoginRoute) {
      // User is authenticated but on login page
      console.log('[AuthGuard] Redirecting to tabs - user already authenticated');
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, pathname]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F7C97B" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
});

