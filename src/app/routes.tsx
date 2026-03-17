import { Navigate, Outlet, createBrowserRouter } from 'react-router';
import { lazy, Suspense, type ReactNode } from 'react';
import { Layout } from './Layout';
import { useAuth } from './context/AuthContext';

const AuthScreen = lazy(() => import('./screens/AuthScreen').then((mod) => ({ default: mod.AuthScreen })));
const TodayScreen = lazy(() => import('./screens/TodayScreen').then((mod) => ({ default: mod.TodayScreen })));
const TasksScreen = lazy(() => import('./screens/TasksScreen').then((mod) => ({ default: mod.TasksScreen })));
const GoalsScreen = lazy(() => import('./screens/GoalsScreen').then((mod) => ({ default: mod.GoalsScreen })));
const GoalDetailScreen = lazy(() => import('./screens/GoalDetailScreen').then((mod) => ({ default: mod.GoalDetailScreen })));
const AnalyticsScreen = lazy(() => import('./screens/AnalyticsScreen').then((mod) => ({ default: mod.AnalyticsScreen })));
const DayDetailScreen = lazy(() => import('./screens/DayDetailScreen').then((mod) => ({ default: mod.DayDetailScreen })));

function LoadingShell() {
  return (
    <div className="dark app-shell" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>
      Loading...
    </div>
  );
}

function LazyScreen({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingShell />}>
      {children}
    </Suspense>
  );
}

function RequireAuth() {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return (
      <div className="dark app-shell" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}

function AuthOnly() {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return (
      <div className="dark app-shell" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>
        Loading...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <LazyScreen>
      <AuthScreen />
    </LazyScreen>
  );
}

export const router = createBrowserRouter([
  {
    path: '/auth',
    Component: AuthOnly,
  },
  {
    Component: RequireAuth,
    children: [
      {
        path: '/',
        Component: Layout,
        children: [
          {
            index: true,
            Component: () => (
              <LazyScreen>
                <TodayScreen />
              </LazyScreen>
            ),
          },
          {
            path: 'tasks',
            Component: () => (
              <LazyScreen>
                <TasksScreen />
              </LazyScreen>
            ),
          },
          {
            path: 'goals',
            Component: () => (
              <LazyScreen>
                <GoalsScreen />
              </LazyScreen>
            ),
          },
          {
            path: 'goals/:goalId',
            Component: () => (
              <LazyScreen>
                <GoalDetailScreen />
              </LazyScreen>
            ),
          },
          {
            path: 'analytics',
            Component: () => (
              <LazyScreen>
                <AnalyticsScreen />
              </LazyScreen>
            ),
          },
          {
            path: 'day/:date',
            Component: () => (
              <LazyScreen>
                <DayDetailScreen />
              </LazyScreen>
            ),
          },
        ],
      },
    ],
  },
]);
