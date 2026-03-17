import { Navigate, Outlet, createBrowserRouter } from 'react-router';
import { lazy, Suspense, type ReactNode } from 'react';
import { Layout } from './Layout';
import { useAuth } from './context/AuthContext';

const importAuthScreen = () => import('./screens/AuthScreen').then((mod) => ({ default: mod.AuthScreen }));
const importTodayScreen = () => import('./screens/TodayScreen').then((mod) => ({ default: mod.TodayScreen }));
const importTasksScreen = () => import('./screens/TasksScreen').then((mod) => ({ default: mod.TasksScreen }));
const importGoalsScreen = () => import('./screens/GoalsScreen').then((mod) => ({ default: mod.GoalsScreen }));
const importGoalDetailScreen = () => import('./screens/GoalDetailScreen').then((mod) => ({ default: mod.GoalDetailScreen }));
const importAnalyticsScreen = () => import('./screens/AnalyticsScreen').then((mod) => ({ default: mod.AnalyticsScreen }));
const importDayDetailScreen = () => import('./screens/DayDetailScreen').then((mod) => ({ default: mod.DayDetailScreen }));

const AuthScreen = lazy(importAuthScreen);
const TodayScreen = lazy(importTodayScreen);
const TasksScreen = lazy(importTasksScreen);
const GoalsScreen = lazy(importGoalsScreen);
const GoalDetailScreen = lazy(importGoalDetailScreen);
const AnalyticsScreen = lazy(importAnalyticsScreen);
const DayDetailScreen = lazy(importDayDetailScreen);

export function prefetchRoutes() {
  void importAuthScreen();
  void importTodayScreen();
  void importTasksScreen();
  void importGoalsScreen();
  void importGoalDetailScreen();
  void importAnalyticsScreen();
  void importDayDetailScreen();
}

function LazyScreen({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      {children}
    </Suspense>
  );
}

function RequireAuth() {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}

function AuthOnly() {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return null;
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
