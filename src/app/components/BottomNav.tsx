import { Home, CheckSquare, Target, BarChart3 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: '/', label: 'Today', icon: Home },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];
  const activeIndex = tabs.findIndex((tab) =>
    tab.path === '/'
      ? location.pathname === '/'
      : location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`)
  );

  return (
    <div className="floating-nav z-50">
      <div className="nav-selector">
        <div
          className="nav-selector-pill"
          style={{
            transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
          }}
        />
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive =
            tab.path === '/'
              ? location.pathname === '/'
              : location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`);
          
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`nav-tab flex items-center justify-center gap-1.5 min-h-[44px] ${isActive ? 'nav-tab-active' : ''}`}
              style={{
                color: isActive ? 'var(--green-5)' : 'var(--text-secondary)',
                transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
              }}
            >
              <span className="nav-tab-icon">
                <Icon size={17} strokeWidth={2.1} />
              </span>
              <span style={{ fontSize: '13px', letterSpacing: '0.01em', fontWeight: isActive ? 600 : 500, lineHeight: 1, whiteSpace: 'nowrap' }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
