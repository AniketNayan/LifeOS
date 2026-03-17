import { Outlet } from 'react-router';
import { BottomNav } from './components/BottomNav';

export function Layout() {
  return (
    <div className="dark app-shell" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      <Outlet />
      <BottomNav />
    </div>
  );
}
