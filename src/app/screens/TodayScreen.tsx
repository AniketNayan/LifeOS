import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Calendar, Clock, ChevronDown, ChevronUp, Check, Target, TimerReset, Sparkles } from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { SettingsButton } from '../components/SettingsButton';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Task } from '../types';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export function TodayScreen() {
  const { tasks, goals, toggleTask, addTask, getDailyRecord, updateDailyRecord } = useData();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [saveIndicators, setSaveIndicators] = useState<Record<string, boolean>>({});

  const today = new Date().toISOString().split('T')[0];
  const todayLabel = new Date(`${today}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const todayRecord = getDailyRecord(today);
  const todayTasks = tasks.filter(t => t.date === today);
  const completedCount = todayTasks.filter(t => t.completed).length;
  const top3Completed = todayRecord.topTasks.filter(task => task.title.trim() && task.completed).length;
  const top3Total = todayRecord.topTasks.filter(task => task.title.trim()).length;
  const combinedCompleted = completedCount + top3Completed;
  const combinedTotal = todayTasks.length + top3Total;
  const completionRate = todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 0;
  const activeGoals = goals.filter(g => g.status === 'active');
  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  const todayGoalContributions = todayTasks.filter(t => t.completed && t.goalId);
  const scoreAccent = getScoreAccent(todayRecord.productivityScore);

  const showSaved = (key: string) => {
    setSaveIndicators(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setSaveIndicators(prev => ({ ...prev, [key]: false })), 1500);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    addTask({
      id: `t${Date.now()}`,
      title: newTaskTitle,
      completed: false,
      priority: 'medium',
      date: today,
      estimatedTime: 30,
      ...(selectedGoalId && { goalId: selectedGoalId }),
      ...(selectedMilestoneId && { milestoneId: selectedMilestoneId }),
    });

    setNewTaskTitle('');
    setSelectedGoalId('');
    setSelectedMilestoneId('');
    setIsAddingTask(false);
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header-panel">
          <div className="page-header-main">
            <div className="page-header-copy">
              <h1 className="page-header-title">Daily brief</h1>
              <p className="page-header-subtitle">
                Plan what matters, execute clearly, and keep momentum visible.
              </p>
              <div className="page-header-meta">
                <span className="page-header-meta-item">
                  <Calendar size={12} />
                  <span>{todayLabel}</span>
                </span>
              </div>
            </div>
            <div className="page-header-actions">
              <SettingsButton />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div
          className="app-card"
          style={{
            padding: '14px 16px',
            background: 'linear-gradient(180deg, rgba(72,187,120,0.07), rgba(72,187,120,0.02))',
            borderColor: 'rgba(72,187,120,0.16)',
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Target size={13} style={{ color: 'var(--green-5)' }} />
                <h2 className="compact-section-title">Main Focus</h2>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {combinedCompleted}/{Math.max(combinedTotal, 1)} tasks done • score {todayRecord.productivityScore}/10
              </p>
            </div>
            {saveIndicators.mainFocus && (
              <span style={{ fontSize: '10px', color: 'var(--green-5)', fontWeight: 600, flexShrink: 0 }}>Saved</span>
            )}
          </div>
          <Input
            placeholder="What matters most today?"
            value={todayRecord.mainFocus}
            onChange={(e) => {
              updateDailyRecord(today, { mainFocus: e.target.value });
              showSaved('mainFocus');
            }}
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              padding: '10px 12px',
            }}
          />
        </div>

        <div className="app-card" style={{ padding: '14px 18px' }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="compact-section-title">Top 3 Tasks</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{top3Total}/3 filled</span>
          </div>
          <div className="space-y-2">
            {todayRecord.topTasks.map((task, index) => (
              <div
                key={task.id}
                className="flex items-center gap-3"
                style={{
                  padding: '8px 0',
                  borderTop: index === 0 ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '20px', flexShrink: 0 }}>0{index + 1}</span>
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() =>
                    updateDailyRecord(today, {
                      topTasks: todayRecord.topTasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t),
                    })
                  }
                  style={{
                    borderColor: task.completed ? 'var(--green-4)' : 'var(--divider)',
                    backgroundColor: task.completed ? 'var(--green-4)' : 'transparent',
                  }}
                />
                <Input
                  placeholder={`Priority ${index + 1}`}
                  value={task.title}
                  onChange={(e) =>
                    updateDailyRecord(today, {
                      topTasks: todayRecord.topTasks.map(t => t.id === task.id ? { ...t, title: e.target.value } : t),
                    })
                  }
                  style={{
                    backgroundColor: 'transparent',
                    border: '0',
                    color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    fontSize: '13px',
                    padding: '0',
                    height: 'auto',
                    boxShadow: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="app-card" style={{ padding: '14px 18px' }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="compact-section-title">Tasks</h2>
            <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
              <DialogTrigger asChild>
                <button className="soft-button rounded-xl px-3 transition-all duration-150" style={{ height: '34px', fontSize: '12px', fontWeight: 600 }}>
                  <span className="icon-button-label">
                    <Plus size={14} />
                    <span>Add</span>
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Task</DialogTitle>
                  <DialogDescription>Create a task and optionally link it to a goal.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Task title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }}
                  />
                  <Select
                    value={selectedGoalId || '__none__'}
                    onValueChange={(value) => {
                      setSelectedGoalId(value === '__none__' ? '' : value);
                      setSelectedMilestoneId('');
                    }}
                  >
                    <SelectTrigger
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--divider)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        height: '40px',
                      }}
                    >
                      <SelectValue placeholder="No goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No goal</SelectItem>
                      {activeGoals.map(goal => (
                        <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedGoalId && selectedGoal && (
                    <Select
                      value={selectedMilestoneId || '__none__'}
                      onValueChange={(value) => setSelectedMilestoneId(value === '__none__' ? '' : value)}
                    >
                      <SelectTrigger
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderColor: 'var(--divider)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          height: '40px',
                        }}
                      >
                        <SelectValue placeholder="No milestone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No milestone</SelectItem>
                        {selectedGoal.milestones.map(milestone => (
                          <SelectItem key={milestone.id} value={milestone.id}>{milestone.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <button onClick={handleAddTask} className="primary-button w-full rounded-xl transition-all duration-150" style={{ height: '42px', fontSize: '14px', fontWeight: 700 }}>
                    Add Task
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-1">
              {todayTasks.length > 0 ? (
                todayTasks.map((task, index) => <TaskItem key={task.id} task={task} index={index} onToggle={toggleTask} />)
              ) : (
              <div className="app-card-muted p-3">
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No tasks for today</p>
              </div>
            )}
          </div>
        </div>

        <div className="app-card" style={{ padding: '14px 18px' }}>
          <div
            className="flex flex-col gap-0 sm:grid sm:items-start"
            style={{
              gridTemplateColumns: 'minmax(0, 1fr) 1px minmax(0, 1fr)',
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TimerReset size={13} style={{ color: scoreAccent }} />
                <h2 className="compact-section-title" style={{ color: scoreAccent }}>Score</h2>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span style={{ fontSize: '20px', fontWeight: 600, color: scoreAccent, lineHeight: 1 }}>
                  {todayRecord.productivityScore}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/10</span>
              </div>
              <Slider
                value={[todayRecord.productivityScore]}
                onValueChange={(value) => updateDailyRecord(today, { productivityScore: value[0] })}
                max={10}
                step={1}
                className="sm:max-w-[92%]"
                style={{
                  ['--slider-range' as string]: scoreAccent,
                  ['--slider-thumb' as string]: 'var(--card)',
                }}
              />
            </div>

            <div
              style={{
                width: '1px',
                alignSelf: 'stretch',
                background: 'rgba(255,255,255,0.05)',
                flexShrink: 0,
              }}
              className="hidden sm:block"
            />

            <div
              style={{
                height: '1px',
                background: 'rgba(255,255,255,0.05)',
                margin: '12px 0',
              }}
              className="sm:hidden"
            />

            <div className="min-w-0 sm:pl-4">
              <h2 className="compact-section-title" style={{ marginBottom: '8px', color: 'var(--green-5)' }}>Habits</h2>
              <div className="space-y-2">
                <ToggleRow label="Health" checked={todayRecord.healthDone} onChange={(checked) => updateDailyRecord(today, { healthDone: checked })} />
                <ToggleRow label="Focus" checked={todayRecord.distractionFree} onChange={(checked) => updateDailyRecord(today, { distractionFree: checked })} />
              </div>
            </div>
          </div>
        </div>

        <div className="app-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="compact-section-title">Goal Momentum</h2>
            <span className="metric-pill">{todayGoalContributions.length} linked</span>
          </div>
          {todayGoalContributions.length > 0 ? (
            <div className="space-y-2">
              {Array.from(new Set(todayGoalContributions.map(task => task.goalId))).map(goalId => {
                const goal = goals.find(g => g.id === goalId);
                if (!goal) return null;
                const goalTasks = todayGoalContributions.filter(task => task.goalId === goalId);
                return (
                  <div key={goalId} className="app-card-muted p-3">
                    <div className="flex items-center gap-2">
                      <Target size={12} style={{ color: 'var(--green-4)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{goal.title}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {goalTasks.length} completed today
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No goal progress today.</p>
          )}
        </div>

        <div className="app-card overflow-hidden" style={{ padding: isNotesExpanded ? '0' : '12px 16px' }}>
          <button onClick={() => setIsNotesExpanded(!isNotesExpanded)} className="w-full flex items-center justify-between transition-all duration-150" style={{ padding: isNotesExpanded ? '12px 16px' : '0' }}>
            <div className="flex items-center gap-2">
              <Sparkles size={13} style={{ color: 'var(--text-secondary)' }} />
              <h2 className="compact-section-title">Notes</h2>
            </div>
            {isNotesExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />}
          </button>
          {isNotesExpanded && (
            <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--divider)', paddingTop: '12px' }}>
              <NoteField label="Work" saved={saveIndicators.workNotes} value={todayRecord.workNotes} onChange={(value) => { updateDailyRecord(today, { workNotes: value }); showSaved('workNotes'); }} />
              <NoteField label="Thoughts" saved={saveIndicators.personalThoughts} value={todayRecord.personalThoughts} onChange={(value) => { updateDailyRecord(today, { personalThoughts: value }); showSaved('personalThoughts'); }} />
              <NoteField label="Lessons" saved={saveIndicators.lessonsLearned} value={todayRecord.lessonsLearned} onChange={(value) => { updateDailyRecord(today, { lessonsLearned: value }); showSaved('lessonsLearned'); }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function NoteField({ label, value, saved, onChange }: { label: string; value: string; saved?: boolean; onChange: (value: string) => void }) {
  return (
    <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between mb-2">
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
        {saved && <span style={{ fontSize: '10px', color: 'var(--green-4)', fontWeight: 600 }}>Saved</span>}
      </div>
      <Textarea
        placeholder={`${label} notes`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          color: 'var(--text-primary)',
          resize: 'none',
          fontSize: '13px',
          padding: '12px 14px',
          minHeight: '88px',
          lineHeight: '1.55',
          boxShadow: 'none',
        }}
      />
    </div>
  );
}

function TaskItem({ task, onToggle, index }: { task: Task; onToggle: (id: string) => void; index: number }) {
  return (
    <div
      className="flex items-center gap-3 transition-all duration-150"
      style={{
        padding: '6px 0',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '20px', flexShrink: 0 }}>{String(index + 1).padStart(2, '0')}</span>
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        style={{
          borderColor: task.completed ? 'var(--green-4)' : 'var(--divider)',
          backgroundColor: task.completed ? 'var(--green-4)' : 'transparent',
          color: task.completed ? 'var(--text-primary)' : 'inherit',
        }}
      />
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: '13px', color: 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.78 : 1 }}>
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          {task.estimatedTime && (
            <div className="flex items-center gap-1">
              <Clock size={10} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{task.estimatedTime} min</span>
            </div>
          )}
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

function getScoreAccent(score: number) {
  if (score === 0) return 'rgba(255,255,255,0.18)';
  if (score <= 3) return 'rgba(72,187,120,0.34)';
  if (score <= 6) return 'rgba(72,187,120,0.56)';
  if (score <= 8) return 'rgba(72,187,120,0.72)';
  return 'var(--green-5)';
}
