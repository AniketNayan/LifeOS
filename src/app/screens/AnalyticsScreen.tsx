import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { SettingsButton } from '../components/SettingsButton';
import { ArrowUpRight, CalendarRange, ChevronLeft, ChevronRight, Flame, Focus, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type AnalyticsDay = {
  date: string;
  score: number;
  tasksCompleted: number;
  goalContributions: number;
  deepWorkHours: number;
  inRange: boolean;
};

type AnalyticsOverview = {
  selectedYear: number;
  currentYear: number;
  availableYears: number[];
  daysInYear: number;
  yearlyActiveDays: number;
  averageScore: number;
  totalTasks: number;
  totalGoals: number;
  totalFocusHours: number;
  bestDay: AnalyticsDay;
  currentStreak: number;
  bestWeek: { score: number; start: string; end: string };
  highlightDays: AnalyticsDay[];
  monthLabels: Array<{ label: string; startColumn: number }>;
  activityWeeks: AnalyticsDay[][];
};

export function AnalyticsScreen() {
  const navigate = useNavigate();
  const { isReady, isAuthenticated } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }
    let cancelled = false;

    const loadAnalytics = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const response = await fetch(`${API_BASE_URL}/analytics/overview?year=${selectedYear}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to load analytics: ${response.status}`);
        }

        const data = await response.json() as AnalyticsOverview;
        if (!cancelled) {
          setAnalytics(data);
        }
      } catch {
        if (!cancelled) {
          setLoadError('Unable to load analytics.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isReady, selectedYear]);

  const availableYears = analytics?.availableYears ?? Array.from({ length: 5 }, (_, index) => currentYear - 4 + index);
  const daysInYear = analytics?.daysInYear ?? (selectedYear % 4 === 0 && (selectedYear % 100 !== 0 || selectedYear % 400 === 0) ? 366 : 365);
  const yearlyActiveDays = analytics?.yearlyActiveDays ?? 0;
  const averageScore = analytics?.averageScore ?? 0;
  const totalTasks = analytics?.totalTasks ?? 0;
  const totalGoals = analytics?.totalGoals ?? 0;
  const totalFocusHours = analytics?.totalFocusHours ?? 0;
  const bestDay = analytics?.bestDay ?? {
    date: `${selectedYear}-01-01`,
    score: 0,
    tasksCompleted: 0,
    goalContributions: 0,
    deepWorkHours: 0,
    inRange: true,
  };
  const currentStreak = analytics?.currentStreak ?? 0;
  const bestWeek = analytics?.bestWeek ?? { score: 0, start: '', end: '' };
  const highlightDays = analytics?.highlightDays ?? [];
  const activityWeeks = analytics?.activityWeeks ?? [];
  const activityMonthLabels = analytics?.monthLabels ?? [];
  const heatmapCellSize = 10;
  const heatmapGap = 4;
  const heatmapHeaderHeight = 20;
  const heatmapWeekdayWidth = 36;
  const heatmapRightPadding = 24;
  const heatmapColumnWidth = heatmapCellSize + heatmapGap;
  const heatmapGridWidth = activityWeeks.length > 0
    ? activityWeeks.length * heatmapCellSize + (activityWeeks.length - 1) * heatmapGap
    : 0;

  const getIntensity = (score: number) => {
    if (score === 0) return 'rgba(255,255,255,0.04)';
    if (score <= 3) return 'rgba(72,187,120,0.18)';
    if (score <= 6) return 'rgba(72,187,120,0.34)';
    if (score <= 8) return 'rgba(72,187,120,0.56)';
    return 'rgba(72,187,120,0.88)';
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header-panel">
          <div className="page-header-main">
            <div className="page-header-copy">
              <h1 className="page-header-title">Momentum overview</h1>
              <div className="page-header-meta">
                <span className="page-header-meta-item">
                  <CalendarRange size={12} />
                  <span>{selectedYear} calendar</span>
                </span>
                <span className="page-header-meta-item">
                  <Sparkles size={12} />
                  <span>{yearlyActiveDays} active days</span>
                </span>
              </div>
            </div>
            <div className="page-header-actions">
              <SettingsButton />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <section className="app-card p-4">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: '16px',
              alignItems: 'end',
            }}
          >
            <div className="min-w-0">
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Score
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {averageScore.toFixed(1)}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>/10</span>
              </div>
            </div>

            <div
              style={{
                textAlign: 'right',
                flexShrink: 0,
                minWidth: '88px',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Best
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--green-5)', marginTop: '6px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {bestDay.score}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {formatShortDate(bestDay.date)}
              </div>
            </div>
          </div>

          <div
            className="mt-3 pt-3"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '0',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <InlineMetric label="Tasks" value={String(totalTasks)} />
            <InlineMetric label="Goals" value={String(totalGoals)} centered />
            <InlineMetric label="Focus" value={`${totalFocusHours.toFixed(1)}h`} align="right" />
          </div>
        </section>

        <section className="app-card p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="compact-section-title">Activity</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedYear((year) => Math.max(availableYears[0], year - 1))}
                  className="page-header-action"
                  style={{ minWidth: '28px', width: '28px', height: '28px', padding: 0 }}
                  aria-label="Previous year"
                  disabled={selectedYear === availableYears[0]}
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="metric-pill" style={{ minWidth: '72px', justifyContent: 'center' }}>{selectedYear}</span>
                <button
                  type="button"
                  onClick={() => setSelectedYear((year) => Math.min(currentYear, year + 1))}
                  className="page-header-action"
                  style={{ minWidth: '28px', width: '28px', height: '28px', padding: 0 }}
                  aria-label="Next year"
                  disabled={selectedYear === currentYear}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
              <span className="metric-pill">{yearlyActiveDays}/{daysInYear} active</span>
            </div>
          </div>

          <div
            className="pt-1"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {loadError ? (
              <div className="app-card-muted p-3">
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{loadError}</p>
              </div>
            ) : null}
            {activityWeeks.length > 0 ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: `${heatmapWeekdayWidth}px`,
                  display: 'grid',
                  gridTemplateRows: `${heatmapHeaderHeight}px repeat(7, ${heatmapCellSize}px)`,
                  gap: `${heatmapGap}px`,
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                }}
              >
                <span />
                <span />
                <span>Mon</span>
                <span />
                <span>Wed</span>
                <span />
                <span>Fri</span>
                <span />
              </div>

              <div className="min-w-0 no-scrollbar" style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', paddingBottom: '2px' }}>
                <div style={{ width: `${heatmapGridWidth + heatmapRightPadding}px`, paddingRight: `${heatmapRightPadding}px` }}>
                  <div
                    style={{
                      position: 'relative',
                      marginBottom: '6px',
                      width: `${heatmapGridWidth}px`,
                      height: `${heatmapHeaderHeight}px`,
                    }}
                  >
                    {activityMonthLabels.map((item) => (
                      <span
                        key={`${item.label}-${item.startColumn}`}
                        style={{
                          position: 'absolute',
                          left: `${(item.startColumn - 1) * heatmapColumnWidth}px`,
                          top: 0,
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          transform: 'translateY(-1px)',
                        }}
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${activityWeeks.length}, ${heatmapCellSize}px)`,
                      gridTemplateRows: `repeat(7, ${heatmapCellSize}px)`,
                      gap: `${heatmapGap}px`,
                      alignContent: 'start',
                    }}
                  >
                    {activityWeeks.flatMap((week, weekIndex) =>
                      week.map((day, dayIndex) => (
                        <button
                          key={day.date}
                          onClick={() => day.inRange && navigate(`/day/${day.date}`)}
                          className="rounded-[2px] transition-all duration-150"
                          style={{
                            width: `${heatmapCellSize}px`,
                            height: `${heatmapCellSize}px`,
                            backgroundColor: day.inRange ? getIntensity(day.score) : 'transparent',
                            border: day.inRange
                              ? day.score === 0
                                ? '1px solid rgba(255,255,255,0.04)'
                                : '1px solid transparent'
                              : '1px solid transparent',
                            gridColumn: weekIndex + 1,
                            gridRow: dayIndex + 1,
                            cursor: day.inRange ? 'pointer' : 'default',
                          }}
                          title={day.inRange ? `${formatLongDate(day.date)} · score ${day.score}` : ''}
                          disabled={!day.inRange}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            ) : (
              <div className="app-card-muted p-3">
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {isLoading ? 'Loading activity…' : 'No activity available for this year.'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mt-3 gap-3">
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Less</span>
              <div className="flex items-center gap-1.5">
                {[0, 3, 6, 9].map((level) => (
                  <div
                    key={level}
                    className="rounded-[3px]"
                    style={{
                      width: '11px',
                      height: '11px',
                      backgroundColor: getIntensity(level),
                      border: level === 0 ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>More</span>
            </div>
          </div>
        </section>

        <div className="responsive-two-col">
          <section className="app-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={14} style={{ color: 'var(--green-5)' }} />
              <h2 className="compact-section-title">Streak</h2>
            </div>
            <InsightRow label="Current streak" value={`${currentStreak} day${currentStreak === 1 ? '' : 's'}`} />
            <InsightRow label="Active days" value={`${yearlyActiveDays}/365`} />
            <InsightRow label="Best week" value={bestWeek.score > 0 ? `${bestWeek.score} pts` : 'No data'} />
            {bestWeek.score > 0 && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
                {formatShortDate(bestWeek.start)} to {formatShortDate(bestWeek.end)}
              </p>
            )}
          </section>

          <section className="app-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Focus size={14} style={{ color: 'var(--green-5)' }} />
              <h2 className="compact-section-title">Output</h2>
            </div>
            <InsightRow label="Task output" value={String(totalTasks)} />
            <InsightRow label="Goal pushes" value={String(totalGoals)} />
            <InsightRow label="Deep work" value={`${totalFocusHours.toFixed(1)}h`} />
            <div className="progress-track mt-3" style={{ height: '8px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (totalGoals / Math.max(totalTasks, 1)) * 100)}%`,
                }}
              />
            </div>
          </section>
        </div>

        <section className="app-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={14} style={{ color: 'var(--green-5)' }} />
            <h2 className="compact-section-title">Highlights</h2>
          </div>

          {highlightDays.length > 0 ? (
            <div className="space-y-2">
              {highlightDays.map((day, index) => (
                <button
                  key={day.date}
                  onClick={() => navigate(`/day/${day.date}`)}
                  className="app-card-muted w-full p-3 text-left transition-all duration-150"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        #{index + 1} {formatLongDate(day.date)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{day.tasksCompleted} tasks</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{day.deepWorkHours.toFixed(1)}h focus</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '16px', color: 'var(--green-5)', fontWeight: 700 }}>{day.score}</span>
                      <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="app-card-muted p-3">
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No highlights yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function InlineMetric({ label, value, align = 'left', centered = false }: { label: string; value: string; align?: 'left' | 'right'; centered?: boolean }) {
  const alignment = centered ? 'center' : align;
  return (
    <div
      className="min-w-0"
      style={{
        padding: '0 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: alignment === 'right' ? 'flex-end' : alignment === 'center' ? 'center' : 'flex-start',
        textAlign: alignment,
      }}
    >
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function formatShortDate(date: string) {
  if (!date) return '';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatLongDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
