import { useData } from '../context/DataContext';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, TrendingUp, Plus, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { SettingsButton } from '../components/SettingsButton';
import { Goal } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

export function GoalsScreen() {
  const { goals, fetchGoalsPage, addGoal } = useData();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [goalView, setGoalView] = useState<'active' | 'future' | 'completed'>('active');
  const [visibleGoals, setVisibleGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [goalPagination, setGoalPagination] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
  const [goalPage, setGoalPage] = useState(1);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  const [newGoalReward, setNewGoalReward] = useState('');

  const lastGoalQueryRef = useRef<string | null>(null);
  const inFlightGoalQueryRef = useRef<string | null>(null);

  const loadGoals = async (options?: { silent?: boolean }) => {
    try {
      const query = { status: goalView, page: goalPage, pageSize: 12 };
      const queryKey = JSON.stringify(query);

      if (inFlightGoalQueryRef.current === queryKey) {
        return;
      }

      if (lastGoalQueryRef.current === queryKey && visibleGoals.length > 0 && !options?.silent) {
        return;
      }

      inFlightGoalQueryRef.current = queryKey;
      setIsLoadingGoals(!options?.silent && visibleGoals.length === 0);

      const { items, pagination } = await fetchGoalsPage(query);
      if (inFlightGoalQueryRef.current === queryKey) {
        setVisibleGoals(items);
        setGoalPagination(pagination ?? null);
        lastGoalQueryRef.current = queryKey;
      }
    } finally {
      if (inFlightGoalQueryRef.current) {
        inFlightGoalQueryRef.current = null;
      }
      setIsLoadingGoals(false);
    }
  };

  useEffect(() => {
    setGoalPage(1);
  }, [goalView]);

  useEffect(() => {
    void loadGoals({ silent: visibleGoals.length > 0 });
  }, [goalPage, goalView]);

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
      targetDate: newGoalTargetDate || undefined,
      reward: newGoalReward || undefined,
      status: 'active',
      milestones: [],
      contributionDays: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    await addGoal(createdGoal);
    setNewGoalTitle('');
    setNewGoalDescription('');
    setNewGoalTargetDate('');
    setNewGoalReward('');
    setIsCreating(false);

    if (goalView === 'active') {
      setVisibleGoals((prev) => [createdGoal, ...prev].slice(0, 12));
    }
    void loadGoals({ silent: true });
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Goal</DialogTitle>
              <DialogDescription>Add a new goal and optional reward.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Goal title" value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }} />
              <Textarea placeholder="Description" value={newGoalDescription} onChange={(e) => setNewGoalDescription(e.target.value)} rows={3} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }} />
              <Input type="date" value={newGoalTargetDate} onChange={(e) => setNewGoalTargetDate(e.target.value)} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }} />
              <Input placeholder="Reward" value={newGoalReward} onChange={(e) => setNewGoalReward(e.target.value)} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }} />
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

      {goalView === 'active' && <GoalLane title="Active Goals" goals={activeGoals} onOpen={(id) => navigate(`/goals/${id}`)} empty={isLoadingGoals ? 'Loading goals...' : 'No active goals'} />}
      {goalView === 'future' && <GoalLane title="Future Goals" goals={futureGoals} onOpen={(id) => navigate(`/goals/${id}`)} empty={isLoadingGoals ? 'Loading goals...' : 'No future goals'} />}
      {goalView === 'completed' && <GoalLane title="Completed Goals" goals={completedGoals} onOpen={(id) => navigate(`/goals/${id}`)} empty={isLoadingGoals ? 'Loading goals...' : 'No completed goals'} />}

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
        <GoalMetaChip icon={<Calendar size={11} />} label={goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No target'} />
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
