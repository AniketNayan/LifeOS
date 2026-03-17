import { useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';

export function AuthScreen() {
  const { isReady, isAuthenticated, login, register, forgotPassword, resetPassword, getGoogleAuthUrl } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    if (token && emailParam) {
      setMode('reset');
      setEmail(emailParam);
      setResetToken(token);
    }
  }, [searchParams]);

  const copy = useMemo(() => {
    if (mode === 'forgot') {
      return {
        title: 'Reset your password',
        description: 'We will send you a reset link to continue.',
        submit: 'Send reset link',
        switchLabel: 'Back to sign in',
        switchPrompt: 'Remembered your password?',
      };
    }

    if (mode === 'reset') {
      return {
        title: 'Set a new password',
        description: 'Choose a new password to secure your account.',
        submit: 'Update password',
        switchLabel: 'Back to sign in',
        switchPrompt: 'Already have access?',
      };
    }

    if (mode === 'login') {
      return {
        title: 'Welcome back',
        description: 'Sign in to continue with your workspace.',
        submit: 'Sign in',
        switchLabel: 'Create account',
        switchPrompt: 'No account yet?',
      };
    }

    return {
      title: 'Create account',
      description: 'Start your workspace with goals, tasks, and history in one place.',
      submit: 'Create account',
      switchLabel: 'Sign in',
      switchPrompt: 'Already have an account?',
    };
  }, [mode]);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (mode === 'forgot') {
      const result = await forgotPassword(email);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInfo('Check your email for a reset link.');
      setDevResetUrl(result.devResetUrl ?? '');
      return;
    }

    if (mode === 'reset') {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      const result = await resetPassword(email, resetToken, newPassword);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInfo('Password updated. You can sign in now.');
      setMode('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setDevResetUrl('');
      return;
    }

    const result = mode === 'login'
      ? await login(email, password)
      : await register(name, email, password);

    if (!result.ok) {
      setError(result.error);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    const result = await getGoogleAuthUrl();

    if (!result.ok) {
      setError(result.error);
      return;
    }

    window.location.href = result.url;
  };

  return (
    <div
      className="dark app-shell"
      style={{
        backgroundColor: 'var(--bg)',
        backgroundImage: 'radial-gradient(circle at top, rgba(72,187,120,0.05), transparent 22%)',
        minHeight: '100vh',
      }}
    >
      <div className="page-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', paddingTop: '32px', paddingBottom: '32px' }}>
        <div className="mx-auto w-full" style={{ maxWidth: '456px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '10px',
              }}
            >
              Life OS
            </div>
            <h1
              style={{
                fontSize: 'clamp(30px, 4.25vw, 38px)',
                lineHeight: 1.05,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.04em',
                marginBottom: '10px',
              }}
            >
              {copy.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: '34ch', margin: '0 auto' }}>
              {copy.description}
            </p>
          </div>

          <div className="app-card" style={{ padding: '22px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                padding: '4px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)',
                marginBottom: '18px',
              }}
            >
              <ModeButton active={mode === 'login'} onClick={() => { setMode('login'); setError(''); }}>
                Sign in
              </ModeButton>
              <ModeButton active={mode === 'register'} onClick={() => { setMode('register'); setError(''); }}>
                Register
              </ModeButton>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {(mode === 'login' || mode === 'register') && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="w-full rounded-xl transition-all duration-150"
                    style={{
                      height: '46px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                    }}
                  >
                    <GoogleMark />
                    <span>Continue with Google</span>
                  </button>

                  <DividerLabel />
                </>
              )}

              {mode === 'register' && (
                <Field label="Full name">
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    style={{ height: '46px' }}
                  />
                </Field>
              )}

              <Field label="Email">
                <Input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  type="email"
                  style={{ height: '46px' }}
                  disabled={mode === 'reset'}
                />
              </Field>

              {(mode === 'login' || mode === 'register') && (
                <Field label="Password">
                  <div style={{ position: 'relative' }}>
                    <Input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      type={showPassword ? 'text' : 'password'}
                      style={{ height: '46px', paddingRight: '44px' }}
                    />
                    <IconToggle
                      onClick={() => setShowPassword((prev) => !prev)}
                      label={showPassword ? 'Hide password' : 'Show password'}
                      active={showPassword}
                    />
                  </div>
                </Field>
              )}

              {mode === 'reset' && (
                <>
                  <Field label="New password">
                    <div style={{ position: 'relative' }}>
                      <Input
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="Enter a new password"
                        type={showNewPassword ? 'text' : 'password'}
                        style={{ height: '46px', paddingRight: '44px' }}
                      />
                      <IconToggle
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        label={showNewPassword ? 'Hide password' : 'Show password'}
                        active={showNewPassword}
                      />
                    </div>
                  </Field>
                  <Field label="Confirm password">
                    <div style={{ position: 'relative' }}>
                      <Input
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Confirm your new password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        style={{ height: '46px', paddingRight: '44px' }}
                      />
                      <IconToggle
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        active={showConfirmPassword}
                      />
                    </div>
                  </Field>
                </>
              )}

              {mode === 'login' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trouble signing in?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                      setInfo('');
                      setDevResetUrl('');
                    }}
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      background: 'transparent',
                    }}
                  >
                    Reset password
                  </button>
                </div>
              )}

              {error && (
                <div
                  style={{
                    backgroundColor: 'rgba(212, 24, 61, 0.10)',
                    border: '1px solid rgba(212, 24, 61, 0.2)',
                    color: '#fb7185',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '13px',
                  }}
                >
                  {error}
                </div>
              )}

              {info && (
                <div
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    color: '#86efac',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '13px',
                  }}
                >
                  {info}
                </div>
              )}

              {devResetUrl && mode === 'forgot' && (
                <div
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.18)',
                    color: '#7dd3fc',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ marginBottom: '6px', fontWeight: 600 }}>Dev reset link</div>
                  <button
                    type="button"
                    onClick={() => window.open(devResetUrl, '_blank', 'noreferrer')}
                    className="rounded-lg transition-all duration-150"
                    style={{
                      width: '100%',
                      height: '38px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      color: '#bae6fd',
                      fontWeight: 600,
                      fontSize: '12px',
                    }}
                  >
                    Open reset link
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="primary-button w-full rounded-xl transition-all duration-150"
                style={{ height: '48px', fontWeight: 700, marginTop: '4px' }}
              >
                {copy.submit}
              </button>
            </form>

            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{copy.switchPrompt}</span>
              <button
                type="button"
                onClick={() => {
                  if (mode === 'forgot' || mode === 'reset') {
                    setMode('login');
                  } else {
                    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
                  }
                  setError('');
                  setInfo('');
                  setDevResetUrl('');
                }}
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  background: 'transparent',
                }}
              >
                {copy.switchLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '11px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '7px',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[10px] transition-all duration-150"
      style={{
        height: '38px',
        fontSize: '12px',
        fontWeight: 700,
        color: active ? 'var(--text-primary)' : 'rgba(148,163,184,0.9)',
        backgroundColor: active ? 'rgba(56,189,248,0.12)' : 'transparent',
        border: active ? '1px solid rgba(56,189,248,0.35)' : '1px solid transparent',
        boxShadow: active ? '0 6px 18px rgba(56,189,248,0.15)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

function DividerLabel() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: 'var(--text-muted)',
        fontSize: '12px',
      }}
    >
      <span style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)', flex: 1 }} />
      <span>or</span>
      <span style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)', flex: 1 }} />
    </div>
  );
}

function IconToggle({ onClick, label, active }: { onClick: () => void; label: string; active: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        position: 'absolute',
        top: '50%',
        right: '10px',
        transform: 'translateY(-50%)',
        width: '30px',
        height: '30px',
        display: 'grid',
        placeItems: 'center',
        borderRadius: '10px',
        backgroundColor: active ? 'rgba(56,189,248,0.16)' : 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: active ? '#bae6fd' : 'rgba(148,163,184,0.9)',
      }}
    >
      {active ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5c5 0 9.3 3.1 11 7-1.7 3.9-6 7-11 7S2.7 15.9 1 12c1.7-3.9 6-7 11-7Zm0 2c-3.7 0-6.9 2-8.6 5 1.7 3 4.9 5 8.6 5s6.9-2 8.6-5c-1.7-3-4.9-5-8.6-5Zm0 2.5A3.5 3.5 0 1 1 8.5 13 3.5 3.5 0 0 1 12 9.5Zm0 2A1.5 1.5 0 1 0 13.5 13 1.5 1.5 0 0 0 12 11.5Z"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="m3 5.3 1.4-1.4 16.3 16.3-1.4 1.4-3.1-3.1A11.3 11.3 0 0 1 12 19c-5 0-9.3-3.1-11-7a12.7 12.7 0 0 1 4.2-5.1L3 5.3ZM7 9.3a3.5 3.5 0 0 0 4.6 4.6L7 9.3ZM12 7c1.3 0 2.6.3 3.8.8l-1.6 1.6a3.5 3.5 0 0 0-4.8 4.8L7.8 16A9.4 9.4 0 0 1 3.4 12C5.1 9 8.3 7 12 7Zm9.6 5c-.5.9-1.2 1.8-2 2.6l-1.5-1.5c.6-.6 1.1-1.2 1.5-1.8-1.7-3-4.9-5-8.6-5-.8 0-1.6.1-2.3.3L7 5.2A10.6 10.6 0 0 1 12 5c5 0 9.3 3.1 11 7Z"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.3 12 2.3a9.7 9.7 0 1 0 0 19.4c5.6 0 9.3-3.9 9.3-9.4 0-.6-.1-1.1-.2-1.6H12Z" />
      <path fill="#34A853" d="M2.3 7.8l3.2 2.3C6.4 7.8 9 5.7 12 5.7c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.3 12 2.3c-3.8 0-7.1 2.2-8.7 5.5Z" />
      <path fill="#FBBC05" d="M12 21.7c2.5 0 4.7-.8 6.3-2.3l-2.9-2.4c-.8.6-1.9 1-3.4 1-4 0-5.2-2.7-5.5-3.6l-3.2 2.5c1.6 3.3 5 4.8 8.7 4.8Z" />
      <path fill="#4285F4" d="M21.3 12.3c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.3 1.2-1.4 3-2.9 4l2.9 2.4c1.7-1.6 2.8-4.1 2.8-8.7Z" />
    </svg>
  );
}
