import { useParams, useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { ArrowLeft, Calendar, Lock, AlertCircle } from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { useCurrentDateKey } from '../lib/date';

export function DayDetailScreen() {
  const { date } = useParams();
  const navigate = useNavigate();
  const { getDailyRecord, updateDailyRecord, tasks } = useData();
  const today = useCurrentDateKey();

  if (!date) return null;

  const selectedDate = new Date(date + 'T00:00:00');
  const record = getDailyRecord(date);
  const dayTasks = tasks.filter(t => t.date === date);

  const isPast = date < today;
  const isToday = date === today;
  const isFuture = date > today;
  const mode = isPast ? 'Archived' : isToday ? 'Today' : 'Planned';

  const handleUpdate = (updates: any) => {
    if (isPast) return;
    updateDailyRecord(date, updates);
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header-panel">
          <div className="page-header-top">
            <div className="page-header-actions">
              <button onClick={() => navigate('/analytics')} className="page-header-action" aria-label="Back to analytics">
                <ArrowLeft size={16} />
              </button>
            </div>
          </div>
          <div className="page-header-main">
            <div className="page-header-copy">
              <h1 className="page-header-title">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </h1>
              <div className="page-header-meta">
                <span className="page-header-meta-item">
                  <Calendar size={12} />
                  <span>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}</span>
                </span>
                <span className="page-header-meta-item">
                  {isPast && <Lock size={12} />}
                  {isFuture && <AlertCircle size={12} />}
                  {!isPast && !isFuture && <Calendar size={12} />}
                  <span>{mode}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <DayStat label="Score" value={String(record.productivityScore)} />
          <DayStat label="Tasks" value={String(dayTasks.filter(t => t.completed).length)} />
          <DayStat label="Goals" value={String(record.goalContributions)} />
        </div>

        <div
          className="app-card p-4"
          style={{
            background: 'linear-gradient(180deg, rgba(72,187,120,0.07), rgba(72,187,120,0.02))',
            borderColor: 'rgba(72,187,120,0.16)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <h2 className="compact-section-title">Main Focus</h2>
          </div>
          {isPast ? (
            <p style={{ fontSize: '14px', color: record.mainFocus ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight: 1.55 }}>
              {record.mainFocus || 'No focus set'}
            </p>
          ) : (
            <Input
              placeholder={isFuture ? 'What will matter?' : 'What mattered most?'}
              value={record.mainFocus}
              onChange={(e) => handleUpdate({ mainFocus: e.target.value })}
              disabled={isFuture}
              style={{ backgroundColor: isFuture ? 'var(--green-0)' : 'var(--surface)', border: '1px solid var(--divider)', color: 'var(--text-primary)', fontSize: '14px', opacity: isFuture ? 0.6 : 1 }}
            />
          )}
        </div>

        <div className="app-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="compact-section-title">Top 3 Tasks</h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{record.topTasks.length} tasks</span>
          </div>
          <div className="space-y-0">
            {record.topTasks.map((task, index) => (
              <div
                key={task.id}
                className="flex items-center gap-3"
                style={{
                  padding: '10px 0',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '18px', flexShrink: 0 }}>0{index + 1}</span>
                <Checkbox
                  checked={task.completed}
                  disabled={isPast}
                  onCheckedChange={() => {
                    if (isPast) return;
                    handleUpdate({
                      topTasks: record.topTasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t),
                    });
                  }}
                  style={{ borderColor: task.completed ? 'var(--green-4)' : 'var(--divider)', backgroundColor: task.completed ? 'var(--green-4)' : 'transparent', opacity: isPast ? 0.5 : 1 }}
                />
                {isPast ? (
                  <p style={{ fontSize: '14px', color: task.title ? 'var(--text-primary)' : 'var(--text-muted)', flex: 1, textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.72 : 1 }}>
                    {task.title || `Task ${index + 1}`}
                  </p>
                ) : (
                  <Input
                    placeholder={`Task ${index + 1}`}
                    value={task.title}
                    onChange={(e) => handleUpdate({ topTasks: record.topTasks.map(t => t.id === task.id ? { ...t, title: e.target.value } : t) })}
                    style={{ backgroundColor: 'transparent', border: '1px solid var(--divider)', color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)', fontSize: '13px' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {!isFuture && (
          <div className="responsive-two-col">
            <div className="app-card p-4">
              <h2 className="compact-section-title" style={{ marginBottom: '10px' }}>Score</h2>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--green-5)', marginBottom: '8px' }}>{record.productivityScore}</div>
              {!isPast && <Slider value={[record.productivityScore]} onValueChange={(value) => handleUpdate({ productivityScore: value[0] })} max={10} step={1} />}
            </div>

            <div className="app-card p-4">
              <h2 className="compact-section-title" style={{ marginBottom: '10px' }}>Habits</h2>
              <div className="space-y-3">
                <HabitRow label="Health" value={record.healthDone ? 'Done' : 'No'} editable={!isPast} checked={record.healthDone} onChange={(checked) => handleUpdate({ healthDone: checked })} />
                <HabitRow label="Focus" value={record.distractionFree ? 'Yes' : 'No'} editable={!isPast} checked={record.distractionFree} onChange={(checked) => handleUpdate({ distractionFree: checked })} />
              </div>
            </div>
          </div>
        )}

        {dayTasks.length > 0 && (
          <div className="app-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="compact-section-title">Tasks</h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{dayTasks.length} logged</span>
            </div>
            <div className="space-y-0">
              {dayTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3"
                  style={{
                    padding: '10px 0',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <Checkbox checked={task.completed} disabled style={{ borderColor: task.completed ? 'var(--green-4)' : 'var(--divider)', backgroundColor: task.completed ? 'var(--green-4)' : 'transparent', opacity: 0.65 }} />
                  <div className="min-w-0 flex-1">
                    <p style={{ fontSize: '14px', color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.72 : 1 }}>
                      {task.title}
                    </p>
                    {task.estimatedTime || task.priority ? (
                      <div className="flex items-center gap-3 mt-1">
                        {task.estimatedTime ? <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{task.estimatedTime} min</span> : null}
                        {task.priority ? <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{task.priority}</span> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isFuture && (
          <div className="app-card overflow-hidden" style={{ padding: '12px 16px' }}>
            <div className="flex items-center justify-between">
              <h2 className="compact-section-title">Notes</h2>
            </div>
            <div className="space-y-3" style={{ borderTop: '1px solid var(--divider)', paddingTop: '12px', marginTop: '12px' }}>
              <DayNote label="Work" value={record.workNotes} isPast={isPast} placeholder="Work notes" onChange={(value) => handleUpdate({ workNotes: value })} />
              <DayNote label="Thoughts" value={record.personalThoughts} isPast={isPast} placeholder="Personal thoughts" onChange={(value) => handleUpdate({ personalThoughts: value })} />
              <DayNote label="Lessons" value={record.lessonsLearned} isPast={isPast} placeholder="Lessons learned" onChange={(value) => handleUpdate({ lessonsLearned: value })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DayStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-card p-3">
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{value}</div>
    </div>
  );
}

function HabitRow({ label, value, editable, checked, onChange }: { label: string; value: string; editable: boolean; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{label}</span>
      {editable ? <Switch checked={checked} onCheckedChange={onChange} /> : <span style={{ fontSize: '12px', color: checked ? 'var(--green-4)' : 'var(--text-muted)' }}>{value}</span>}
    </div>
  );
}

function DayNote({ label, value, isPast, placeholder, onChange }: { label: string; value: string; isPast: boolean; placeholder: string; onChange: (value: string) => void }) {
  return (
    <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      {isPast ? (
        <p style={{ fontSize: '14px', color: value ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
          {value || `No ${label.toLowerCase()}`}
        </p>
      ) : (
        <Textarea placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} rows={3} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', padding: '12px 14px', minHeight: '88px', lineHeight: '1.55' }} />
      )}
    </div>
  );
}
