import { useEffect, useState } from 'react';

const pad = (value: number) => String(value).padStart(2, '0');

export function getLocalDateKey(input: Date | string = new Date()) {
  const date = parseDateKey(input);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getLocalDateKeyWithOffset(offsetDays: number, base: Date | string = new Date()) {
  const date = parseDateKey(base);
  date.setDate(date.getDate() + offsetDays);
  return getLocalDateKey(date);
}

export function parseDateKey(input: Date | string) {
  return typeof input === 'string' ? new Date(`${input}T00:00:00`) : new Date(input);
}

export function useCurrentDateKey() {
  const [dateKey, setDateKey] = useState(() => getLocalDateKey());

  useEffect(() => {
    let timer: number | undefined;

    const sync = () => setDateKey(getLocalDateKey());

    const scheduleNextSync = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      const delay = Math.max(nextMidnight.getTime() - now.getTime() + 50, 50);
      timer = window.setTimeout(() => {
        sync();
        scheduleNextSync();
      }, delay);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        sync();
      }
    };

    sync();
    scheduleNextSync();
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return dateKey;
}
