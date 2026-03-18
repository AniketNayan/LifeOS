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
              className={`nav-tab flex flex-col items-center justify-center gap-0.5 min-h-[46px] px-2 py-1 md:flex-row md:gap-1.5 md:min-h-[44px] md:px-0 md:py-0 ${isActive ? 'nav-tab-active nav-tab-active-custom' : ''}`}
              style={{
                color: isActive ? 'var(--green-5)' : 'var(--text-secondary)',
                transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                borderRadius: '12px',
                transition: 'color 220ms, transform 220ms',
              }}
            >
              <span className="nav-tab-icon" style={{ width: 28, height: 28, background: isActive ? 'rgba(72,187,120,0.12)' : 'transparent', borderRadius: 8, transition: 'background 220ms' }}>
                <Icon size={20} strokeWidth={2.2} />
              </span>
              <span style={{ fontSize: '13px', letterSpacing: '0.01em', fontWeight: isActive ? 700 : 500, lineHeight: 1.15, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
