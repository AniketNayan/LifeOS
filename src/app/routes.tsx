import { Navigate, Outlet, createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { TodayScreen } from './screens/TodayScreen';
import { TasksScreen } from './screens/TasksScreen';
import { GoalsScreen } from './screens/GoalsScreen';
import { GoalDetailScreen } from './screens/GoalDetailScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { DayDetailScreen } from './screens/DayDetailScreen';
import { AuthScreen } from './screens/AuthScreen';
import { useAuth } from './context/AuthContext';

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

  return <AuthScreen />;
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
          { index: true, Component: TodayScreen },
          { path: 'tasks', Component: TasksScreen },
          { path: 'goals', Component: GoalsScreen },
          { path: 'goals/:goalId', Component: GoalDetailScreen },
          { path: 'analytics', Component: AnalyticsScreen },
          { path: 'day/:date', Component: DayDetailScreen },
        ],
      },
    ],
  },
]);
