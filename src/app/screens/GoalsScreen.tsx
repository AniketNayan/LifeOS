import { useData } from '../context/DataContext';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, TrendingUp, Plus, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { SettingsButton } from '../components/SettingsButton';
import { Goal } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { getLocalDateKey, parseDateKey, useCurrentDateKey } from '../lib/date';

const goalPageCacheStore = new Map<string, { items: Goal[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } | null }>();
let lastGoalViewState: { view: 'active' | 'future' | 'completed'; page: number } = { view: 'active', page: 1 };
let hasLoadedGoalsOnce = false;

export function GoalsScreen() {
  const today = useCurrentDateKey();
  const initialQueryKey = JSON.stringify({ status: lastGoalViewState.view, page: lastGoalViewState.page, pageSize: 12 });
  const cachedInitial = goalPageCacheStore.get(initialQueryKey);
  const { goals, fetchGoalsPage, addGoal } = useData();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [goalView, setGoalView] = useState<'active' | 'future' | 'completed'>(lastGoalViewState.view);
  const [visibleGoals, setVisibleGoals] = useState<Goal[]>(() => cachedInitial?.items ?? []);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [goalPagination, setGoalPagination] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(() => cachedInitial?.pagination ?? null);
  const [goalPage, setGoalPage] = useState(lastGoalViewState.page);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(hasLoadedGoalsOnce);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalStartDate, setNewGoalStartDate] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  const [newGoalReward, setNewGoalReward] = useState('');
  const [newGoalStatus, setNewGoalStatus] = useState<'active' | 'future'>('active');

  const computeDefaultStatus = (startDate?: string, targetDate?: string) => {
    if (startDate && startDate > today) return 'future';
    if (!startDate && targetDate && targetDate > today) return 'future';
      <div
        className="app-card-muted"
        style={{
          position: 'relative',
          padding: '4px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '4px',
          marginBottom: '12px',
        }}
      >
        {/* Animated pill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '33.3333%',
            borderRadius: 10,
            background: 'rgba(234, 179, 8, 0.16)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(234, 179, 8, 0.08)',
            transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0.44, 1)',
            transform: `translateX(${['active','future','completed'].indexOf(goalView) * 100}%)`,
            zIndex: 0,
          }}
        />
        {[
          { key: 'active', label: 'Active' },
          { key: 'future', label: 'Future' },
          { key: 'completed', label: 'Completed' },
        ].map((option) => {
          const isActive = goalView === option.key;
          return (
            <button
              key={option.key}
              onClick={() => setGoalView(option.key as typeof goalView)}
              className="rounded-lg transition-all duration-150"
              style={{
                position: 'relative',
                zIndex: 1,
                height: '34px',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                background: 'transparent',
                border: '1px solid transparent',
                boxShadow: 'none',
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

  useEffect(() => {
    setGoalPage(1);
  }, [goalView]);

  useEffect(() => {
    lastGoalViewState = { view: goalView, page: goalPage };
    void loadGoals({ silent: goalPageCacheStore.has(queryKey) });
  }, [goalPage, goalView, queryKey]);

  const completedCount = goals.filter((g) => g.rewardClaimed || g.status === 'completed').length;
  const activeCount = goals.filter((g) => !g.rewardClaimed && g.status === 'active').length;
  const futureCount = goals.filter((g) => !g.rewardClaimed && g.status === 'future').length;
  const completedGoals = goalView === 'completed' ? visibleGoals : [];
  const activeGoals = goalView === 'active' ? visibleGoals : [];
  const futureGoals = goalView === 'future' ? visibleGoals : [];

  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) return;
    const createdGoal: Goal = {
      id: `g${Date.now()}`,
      title: newGoalTitle,
      description: newGoalDescription,
      startDate: newGoalStartDate || undefined,
      targetDate: newGoalTargetDate || undefined,
      reward: newGoalReward || undefined,
      status: newGoalStatus,
      milestones: [],
      contributionDays: 0,
      createdAt: getLocalDateKey(),
    };

    await addGoal(createdGoal);
    setNewGoalTitle('');
    setNewGoalDescription('');
    setNewGoalStartDate('');
    setNewGoalTargetDate('');
    setNewGoalReward('');
    setNewGoalStatus('active');
    setIsCreating(false);

    if (goalView === createdGoal.status && goalPage === 1) {
      setVisibleGoals((prev) => {
        const next = [createdGoal, ...prev].slice(0, 12);
        goalPageCacheStore.set(queryKey, { items: next, pagination: goalPagination ?? null });
        return next;
      });
      if (goalPagination) {
        const total = goalPagination.total + 1;
        const totalPages = Math.max(1, Math.ceil(total / goalPagination.pageSize));
        setGoalPagination({ ...goalPagination, total, totalPages });
      }
    }
    // Avoid immediate reload so the optimistic item stays visible.
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <div className="page-header-panel">
            <div className="page-header-main">
              <div className="page-header-copy">
                <h1 className="page-header-title">Goal portfolio</h1>
                <p className="page-header-subtitle">
                  Track active, future, and completed goals in one place.
                </p>
              </div>
              <div className="page-header-actions">
                <SettingsButton />
                <DialogTrigger asChild>
                  <button className="page-header-action" aria-label="Create goal">
                    <Plus size={16} />
                  </button>
                </DialogTrigger>
              </div>
            </div>
          </div>
          <DialogContent style={{ maxWidth: '420px', padding: '18px' }}>
            <DialogHeader>
              <DialogTitle>Create Goal</DialogTitle>
              <DialogDescription>Set the intent, then lock the timeline and reward.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="app-card-muted p-2.5 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="space-y-2">
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Goal name</label>
                  <Input
                    placeholder="Goal title"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="space-y-2">
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</label>
                  <Textarea
                    placeholder="Why this matters, how you'll measure it…"
                    value={newGoalDescription}
                    onChange={(e) => setNewGoalDescription(e.target.value)}
                    rows={3}
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="app-card-muted p-2.5 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="space-y-2">
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</label>
                  <Select value={newGoalStatus} onValueChange={(value) => setNewGoalStatus(value as 'active' | 'future')}>
                    <SelectTrigger style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active goal</SelectItem>
                      <SelectItem value="future">Future goal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Timeline</label>
                  <div className="responsive-form-grid">
                    <div className="space-y-1.5">
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Start date</span>
                      <Input
                        type="date"
                        placeholder="Start date"
                        aria-label="Start date"
                        value={newGoalStartDate}
                        onChange={(e) => {
                          const nextDate = e.target.value;
                          setNewGoalStartDate(nextDate);
                          setNewGoalStatus(computeDefaultStatus(nextDate, newGoalTargetDate));
                        }}
                        style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target date</span>
                      <Input
                        type="date"
                        placeholder="Target date"
                        aria-label="Target date"
                        value={newGoalTargetDate}
                        onChange={(e) => {
                          const nextDate = e.target.value;
                          setNewGoalTargetDate(nextDate);
                          setNewGoalStatus(computeDefaultStatus(newGoalStartDate, nextDate));
                        }}
                        style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target date is optional if start date is set.</p>
                </div>
              </div>

              <div className="app-card-muted p-2.5 space-y-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reward</label>
                <Input
                  placeholder="Reward"
                  value={newGoalReward}
                  onChange={(e) => setNewGoalReward(e.target.value)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }}
                />
              </div>

              <button onClick={handleCreateGoal} className="primary-button w-full rounded-xl transition-all duration-150" style={{ height: '42px', fontSize: '14px', fontWeight: 700 }}>
                Create Goal
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <OverviewTile label="Active" value={String(activeCount)} />
        <OverviewTile label="Future" value={String(futureCount)} />
        <OverviewTile label="Done" value={String(completedCount)} />
      </div>

      <div
        className="app-card-muted"
        style={{
          padding: '4px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '4px',
          marginBottom: '12px',
        }}
      >
        {[
          { key: 'active', label: 'Active' },
          { key: 'future', label: 'Future' },
          { key: 'completed', label: 'Completed' },
        ].map((option) => {
          const isActive = goalView === option.key;
          return (
            <button
              key={option.key}
              onClick={() => setGoalView(option.key as typeof goalView)}
              className="rounded-lg transition-all duration-150"
              style={{
                height: '34px',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                background: isActive
                  ? option.key === 'future'
                    ? 'rgba(96, 165, 250, 0.16)'
                    : option.key === 'completed'
                      ? 'rgba(72, 187, 120, 0.16)'
                      : 'rgba(245, 158, 11, 0.16)'
                  : 'transparent',
                border: isActive
                  ? option.key === 'future'
                    ? '1px solid rgba(96, 165, 250, 0.22)'
                    : option.key === 'completed'
                      ? '1px solid rgba(72, 187, 120, 0.22)'
                      : '1px solid rgba(245, 158, 11, 0.22)'
                  : '1px solid transparent',
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {goalView === 'active' && <GoalLane title="Active Goals" goals={activeGoals} onOpen={(id) => navigate(`/goals/${id}`)} empty={isLoadingGoals && !hasLoadedOnce ? 'Loading goals...' : 'No active goals'} />}
      {goalView === 'future' && <GoalLane title="Future Goals" goals={futureGoals} onOpen={(id) => navigate(`/goals/${id}`)} empty={isLoadingGoals && !hasLoadedOnce ? 'Loading goals...' : 'No future goals'} />}
      {goalView === 'completed' && <GoalLane title="Completed Goals" goals={completedGoals} onOpen={(id) => navigate(`/goals/${id}`)} empty={isLoadingGoals && !hasLoadedOnce ? 'Loading goals...' : 'No completed goals'} />}

      <GoalPaginationControls
        page={goalPagination?.page ?? goalPage}
        totalPages={goalPagination?.totalPages ?? 1}
        total={goalPagination?.total ?? visibleGoals.length}
        isLoading={isLoadingGoals}
        onPrevious={() => setGoalPage((page) => Math.max(1, page - 1))}
        onNext={() => setGoalPage((page) => Math.min(goalPagination?.totalPages ?? page, page + 1))}
      />
    </div>
  );
}

function GoalPaginationControls({
  page,
  totalPages,
  total,
  isLoading,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (isLoading) {
    return null;
  }

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="app-card p-3 flex items-center justify-between gap-3">
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        {total} goal{total === 1 ? '' : 's'} · Page {page} of {Math.max(totalPages, 1)}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={page <= 1}
          className="page-header-action"
          style={{ minWidth: '32px', width: '32px', height: '32px', padding: 0 }}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="page-header-action"
          style={{ minWidth: '32px', width: '32px', height: '32px', padding: 0 }}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function OverviewTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-card" style={{ padding: '10px 12px', minHeight: '72px' }}>
      <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.1 }}>{value}</p>
    </div>
  );
}

    </div>
  );
}

function GoalLane({ title, goals, onOpen, empty }: { title: string; goals: Goal[]; onOpen: (id: string) => void; empty: string }) {
  return (
    <section className="mb-5">
      <h2 className="compact-section-title" style={{ marginBottom: '10px' }}>{title}</h2>
      {goals.length > 0 ? (
        <div className="app-card" style={{ padding: '6px 16px' }}>
          {goals.map((goal, index) => (
            <GoalCard key={goal.id} goal={goal} index={index} onClick={() => onOpen(goal.id)} />
          ))}
        </div>
      ) : (
        <div className="app-card p-4">
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{empty}</p>
        </div>
      )}
    </section>
  );
}

function GoalCard({ goal, index, onClick }: { goal: Goal; index: number; onClick: () => void }) {
  const totalShortGoals = goal.milestones.reduce((sum, m) => sum + m.shortGoals.length, 0);
  const completedShortGoals = goal.milestones.reduce((sum, m) => sum + m.shortGoals.filter(sg => sg.completed).length, 0);
  const progress = totalShortGoals > 0 ? (completedShortGoals / totalShortGoals) * 100 : 0;
  const formatDate = (value?: string) =>
    value ? parseDateKey(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
  const startLabel = formatDate(goal.startDate);
  const targetLabel = formatDate(goal.targetDate);
  const dateLabel = startLabel ? `Start ${startLabel}` : targetLabel ?? 'No dates';

  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all duration-150"
      style={{
        padding: '12px 0',
        borderTop: index === 0 ? '0' : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, wordBreak: 'break-word' }}>
            {goal.title}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.45 }}>
            {goal.description}
          </p>
        </div>
        <span style={{ fontSize: '14px', color: 'var(--green-5)', fontWeight: 600, flexShrink: 0 }}>
          {Math.round(progress)}%
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <GoalMetaChip icon={<TrendingUp size={11} />} label={`${goal.milestones.length} milestone${goal.milestones.length === 1 ? '' : 's'}`} />
        <GoalMetaChip icon={<Calendar size={11} />} label={dateLabel} />
        <GoalMetaChip icon={<Award size={11} />} label={goal.reward ? 'Reward set' : 'No reward'} />
      </div>

      <div className="progress-track" style={{ height: '6px' }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </button>
  );
}

function GoalMetaChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5"
      style={{
        backgroundColor: 'var(--surface-soft)',
        border: '1px solid var(--surface-soft-border)',
        color: 'var(--text-secondary)',
        fontSize: '11px',
        lineHeight: 1,
      }}
    >
      <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
