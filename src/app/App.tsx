import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router, prefetchRoutes } from './routes';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const idle = window as Window & {
        requestIdleCallback?: (cb: () => void) => number;
        cancelIdleCallback?: (id: number) => void;
      };
      const id = idle.requestIdleCallback?.(() => prefetchRoutes());
      return () => {
        if (id !== undefined) {
          idle.cancelIdleCallback?.(id);
        }
      };
    }

    const timeout = window.setTimeout(() => prefetchRoutes(), 150);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <AuthProvider>
      <DataProvider>
        <RouterProvider router={router} />
      </DataProvider>
    </AuthProvider>
  );
}
