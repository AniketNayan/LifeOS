import { LogOut, Settings, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useAuth } from '../context/AuthContext';

export function SettingsButton() {
  const { currentUser, logout } = useAuth();
  const name = currentUser?.name || 'Guest';
  const email = currentUser?.email || 'Not signed in';
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="page-header-action" aria-label="Open settings">
          <Settings size={16} />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Profile, account access, and sign out.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="app-card-muted p-4 flex items-center gap-3">
            <div
              aria-hidden="true"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '999px',
                backgroundColor: 'rgba(72, 187, 120, 0.14)',
                border: '1px solid rgba(72, 187, 120, 0.2)',
                color: 'var(--green-5)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{name}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{email}</p>
            </div>
          </div>

          <div className="app-card-muted p-3 flex items-center gap-3">
            <ShieldCheck size={16} style={{ color: 'var(--green-5)', flexShrink: 0 }} />
            <div className="min-w-0">
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>Account status</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {currentUser ? 'Signed in on this device' : 'No active session'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl transition-all duration-150"
            style={{
              height: '42px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'rgba(212, 24, 61, 0.12)',
              border: '1px solid rgba(212, 24, 61, 0.2)',
              color: '#fb7185',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
