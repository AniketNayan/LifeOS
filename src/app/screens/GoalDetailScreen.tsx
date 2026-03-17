import { useParams, useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { ArrowLeft, Calendar, Award, TrendingUp, ChevronDown, ChevronUp, Clock, MoreVertical, Plus, Settings2 } from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { memo, useCallback, useState } from 'react';
import { Milestone, TaskPriority } from '../types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export function GoalDetailScreen() {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const { goals, toggleShortGoal, claimReward, updateGoal, deleteGoal, addMilestone, deleteMilestone, addShortGoal, updateShortGoal, deleteShortGoal } = useData();

  const goal = goals.find(g => g.id === goalId);
  const resolvedGoalId = goal?.id ?? '';
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [showRewardBurst, setShowRewardBurst] = useState(false);
  const [editTitle, setEditTitle] = useState(goal?.title || '');
  const [editDescription, setEditDescription] = useState(goal?.description || '');
  const [editTargetDate, setEditTargetDate] = useState(goal?.targetDate || '');
  const [editReward, setEditReward] = useState(goal?.reward || '');
  const [editStatus, setEditStatus] = useState<'active' | 'future'>(goal?.status === 'future' ? 'future' : 'active');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  const handleSaveEdit = () => {
    if (!resolvedGoalId || !editTitle.trim()) return;
    updateGoal(goal.id, {
      title: editTitle,
      description: editDescription,
      targetDate: editTargetDate || undefined,
      reward: editReward || undefined,
      status: editStatus,
    });
    setIsEditing(false);
  };

  const handleAddMilestone = () => {
    if (!resolvedGoalId || !newMilestoneTitle.trim()) return;
    const milestone: Milestone = {
      id: `m${Date.now()}`,
      title: newMilestoneTitle,
      goalId: goal.id,
      shortGoals: [],
    };
    addMilestone(goal.id, milestone);
    setNewMilestoneTitle('');
    setIsAddingMilestone(false);
  };

  const handleClaimReward = () => {
    if (!resolvedGoalId) return;
    setShowRewardBurst(true);
    claimReward(goal.id);
    window.setTimeout(() => setShowRewardBurst(false), 1200);
  };

  const handleToggleExpand = useCallback((milestoneId: string) => {
    setExpandedMilestones(prev => {
      const next = new Set(prev);
      if (next.has(milestoneId)) {
        next.delete(milestoneId);
      } else {
        next.add(milestoneId);
      }
      return next;
    });
  }, []);

  const handleDeleteMilestone = useCallback((milestoneId: string) => {
    if (!resolvedGoalId) return;
    deleteMilestone(resolvedGoalId, milestoneId);
  }, [deleteMilestone, resolvedGoalId]);

  const handleToggleShortGoal = useCallback((milestoneId: string, shortGoalId: string) => {
    if (!resolvedGoalId) return;
    toggleShortGoal(resolvedGoalId, milestoneId, shortGoalId);
  }, [resolvedGoalId, toggleShortGoal]);

  const handleAddShortGoal = useCallback((milestoneId: string, shortGoal: Milestone['shortGoals'][number]) => {
    if (!resolvedGoalId) return;
    addShortGoal(resolvedGoalId, milestoneId, shortGoal);
  }, [addShortGoal, resolvedGoalId]);

  const handleUpdateShortGoal = useCallback((milestoneId: string, shortGoalId: string, updates: Partial<Milestone['shortGoals'][number]>) => {
    if (!resolvedGoalId) return;
    updateShortGoal(resolvedGoalId, milestoneId, shortGoalId, updates);
  }, [resolvedGoalId, updateShortGoal]);

  const handleDeleteShortGoal = useCallback((milestoneId: string, shortGoalId: string) => {
    if (!resolvedGoalId) return;
    deleteShortGoal(resolvedGoalId, milestoneId, shortGoalId);
  }, [deleteShortGoal, resolvedGoalId]);

  if (!goal) {
    return <div className="page-shell" style={{ paddingTop: '24px', color: 'var(--text-primary)' }}>Goal not found</div>;
  }

  const totalShortGoals = goal.milestones.reduce((sum, m) => sum + m.shortGoals.length, 0);
  const completedShortGoals = goal.milestones.reduce((sum, m) => sum + m.shortGoals.filter(sg => sg.completed).length, 0);
  const overallProgress = totalShortGoals > 0 ? (completedShortGoals / totalShortGoals) * 100 : 0;
  const isCompleted = overallProgress === 100;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header-panel">
          <div className="page-header-top">
            <div className="page-header-actions">
              <button onClick={() => navigate('/goals')} className="page-header-action" aria-label="Back to goals">
                <ArrowLeft size={16} />
              </button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="page-header-action" aria-label="Goal actions">
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--divider)' }}>
                {!goal.rewardClaimed && (
                  <DropdownMenuItem
                    onClick={() => {
                      setEditTitle(goal.title);
                      setEditDescription(goal.description);
                      setEditTargetDate(goal.targetDate || '');
                      setEditReward(goal.reward || '');
                      setEditStatus(goal.status === 'future' ? 'future' : 'active');
                      setIsEditing(true);
                    }}
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Edit Goal
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setIsDeleting(true)} style={{ color: 'var(--destructive)' }}>
                  Delete Goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="page-header-main">
            <div className="page-header-copy">
              <h1 className="page-header-title" style={{ fontSize: '28px' }}>{goal.title}</h1>
              {goal.description && (
                <p className="page-header-subtitle">{goal.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="app-card p-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {goal.targetDate && (
              <div className="metric-pill">
                <Calendar size={11} />
                <span>{new Date(goal.targetDate).toLocaleDateString('en-US')}</span>
              </div>
            )}
            <div className="metric-pill">
              <TrendingUp size={11} />
              <span>{completedShortGoals}/{totalShortGoals || 0} completed</span>
            </div>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.55', marginBottom: '10px' }}>{goal.description}</p>
          <div className="progress-track" style={{ height: '7px' }}>
            <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="compact-section-title">Milestone Ladder</h2>
            {!goal.rewardClaimed && (
              <button onClick={() => setIsAddingMilestone(true)} className="soft-button rounded-xl transition-all duration-150 px-3" style={{ height: '36px', fontSize: '12px', fontWeight: 600 }}>
                <span className="icon-button-label">
                  <Plus size={14} />
                  <span>Add</span>
                </span>
              </button>
            )}
          </div>
          <div className="space-y-2">
            {goal.milestones.map(milestone => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                isRewardClaimed={Boolean(goal.rewardClaimed)}
                isExpanded={expandedMilestones.has(milestone.id)}
                onToggleExpand={handleToggleExpand}
                onToggleShortGoal={handleToggleShortGoal}
                onAddShortGoal={handleAddShortGoal}
                onUpdateShortGoal={handleUpdateShortGoal}
                onDeleteShortGoal={handleDeleteShortGoal}
                onDeleteMilestone={handleDeleteMilestone}
              />
            ))}
          </div>
        </div>

        {goal.reward && (
          <div
            className="app-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: '16px',
              background: 'linear-gradient(180deg, rgba(72,187,120,0.08), rgba(72,187,120,0.02))',
              borderColor: 'rgba(72,187,120,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
          >
            {showRewardBurst && (
              <div className="reward-burst" aria-hidden="true">
                {Array.from({ length: 14 }, (_, index) => (
                  <span
                    key={index}
                    className="reward-burst-dot"
                    style={{
                      ['--burst-x' as string]: `${Math.cos((index / 14) * Math.PI * 2) * 90}px`,
                      ['--burst-y' as string]: `${Math.sin((index / 14) * Math.PI * 2) * 70}px`,
                      ['--burst-delay' as string]: `${index * 18}ms`,
                    }}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(72,187,120,0.14)',
                    color: 'var(--green-5)',
                    flexShrink: 0,
                    border: '1px solid rgba(72,187,120,0.16)',
                  }}
                >
                  <Award size={14} />
                </div>
                <div className="min-w-0">
                  <span style={{ fontSize: '12px', color: 'var(--green-5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Reward
                  </span>
                </div>
              </div>

              {isCompleted && !goal.rewardClaimed && (
                <button
                  onClick={handleClaimReward}
                  className="transition-all duration-150"
                  style={{
                    height: '34px',
                    padding: '0 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    flexShrink: 0,
                    borderRadius: '999px',
                    color: 'var(--green-5)',
                    background: 'rgba(72,187,120,0.12)',
                    border: '1px solid rgba(72,187,120,0.16)',
                  }}
                >
                  Claim
                </button>
              )}

              {goal.rewardClaimed && (
                <span
                  className="metric-pill"
                  style={{
                    color: 'var(--green-5)',
                    background: 'rgba(72,187,120,0.10)',
                    borderColor: 'rgba(72,187,120,0.16)',
                    flexShrink: 0,
                  }}
                >
                  Unlocked
                </span>
              )}
            </div>

            <div
              className="app-card-muted"
              style={{
                marginTop: '14px',
                padding: '14px',
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.06)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Unlock on completion
              </p>
              <p style={{ fontSize: '20px', color: 'var(--green-5)', lineHeight: '1.3', fontWeight: 600 }}>
                {goal.reward}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2" style={{ marginTop: '10px' }}>
                <span
                  className="metric-pill"
                  style={{
                    padding: '6px 10px',
                    color: goal.rewardClaimed ? 'var(--green-5)' : isCompleted ? '#f59e0b' : 'var(--text-secondary)',
                    background: goal.rewardClaimed
                      ? 'rgba(72,187,120,0.10)'
                      : isCompleted
                        ? 'rgba(245,158,11,0.14)'
                        : 'var(--surface-soft)',
                    borderColor: goal.rewardClaimed
                      ? 'rgba(72,187,120,0.14)'
                      : isCompleted
                        ? 'rgba(245,158,11,0.18)'
                        : 'var(--surface-soft-border)',
                  }}
                >
                  {goal.rewardClaimed ? 'Unlocked' : isCompleted ? 'Ready to claim' : 'Locked'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
            <DialogDescription>Create the next step in this goal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Milestone title" value={newMilestoneTitle} onChange={(e) => setNewMilestoneTitle(e.target.value)} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }} />
            <button onClick={handleAddMilestone} className="primary-button w-full rounded-xl transition-all duration-150" style={{ height: '42px', fontSize: '14px', fontWeight: 700 }}>
              Add Milestone
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>Update the goal details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }} />
            <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" rows={3} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }} />
            <Select value={editStatus} onValueChange={(value) => setEditStatus(value as 'active' | 'future')}>
              <SelectTrigger style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active goal</SelectItem>
                <SelectItem value="future">Future goal</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={editTargetDate}
              onChange={(e) => {
                const nextDate = e.target.value;
                setEditTargetDate(nextDate);
                if (nextDate) {
                  setEditStatus(nextDate > new Date().toISOString().split('T')[0] ? 'future' : 'active');
                }
              }}
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }}
            />
            <Input value={editReward} onChange={(e) => setEditReward(e.target.value)} placeholder="Reward" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }} />
            <button onClick={handleSaveEdit} className="primary-button w-full rounded-xl transition-all duration-150" style={{ height: '42px', fontSize: '14px', fontWeight: 700 }}>
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the goal and all milestones.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="soft-button w-full rounded-xl transition-all duration-150" style={{ height: '42px' }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteGoal(goal.id); navigate('/goals'); }} className="w-full rounded-xl transition-all duration-150" style={{ height: '42px', backgroundColor: 'var(--destructive)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700 }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-card p-3">
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{value}</div>
    </div>
  );
}

const MilestoneCard = memo(function MilestoneCard({
  milestone,
  isRewardClaimed,
  isExpanded,
  onToggleExpand,
  onToggleShortGoal,
  onAddShortGoal,
  onUpdateShortGoal,
  onDeleteShortGoal,
  onDeleteMilestone,
}: {
  milestone: Milestone;
  isRewardClaimed: boolean;
  isExpanded: boolean;
  onToggleExpand: (milestoneId: string) => void;
  onToggleShortGoal: (milestoneId: string, shortGoalId: string) => void;
  onAddShortGoal: (milestoneId: string, shortGoal: Milestone['shortGoals'][number]) => void;
  onUpdateShortGoal: (milestoneId: string, shortGoalId: string, updates: Partial<Milestone['shortGoals'][number]>) => void;
  onDeleteShortGoal: (milestoneId: string, shortGoalId: string) => void;
  onDeleteMilestone: (milestoneId: string) => void;
}) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [isManaging, setIsManaging] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskMinutes, setEditTaskMinutes] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<TaskPriority>('medium');
  const completedCount = milestone.shortGoals.filter(sg => sg.completed).length;
  const totalCount = milestone.shortGoals.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleAddShortGoal = () => {
    if (!newTaskTitle.trim()) return;

    onAddShortGoal(milestone.id, {
      id: `sg${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
      estimatedTime: newTaskMinutes ? Number(newTaskMinutes) : undefined,
      priority: newTaskPriority,
    });

    setNewTaskTitle('');
    setNewTaskMinutes('');
    setNewTaskPriority('medium');
    setIsCreatingTask(false);
  };

  const openEditTask = (shortGoal: Milestone['shortGoals'][number]) => {
    setEditingTaskId(shortGoal.id);
    setEditTaskTitle(shortGoal.title);
    setEditTaskMinutes(shortGoal.estimatedTime ? String(shortGoal.estimatedTime) : '');
    setEditTaskPriority(shortGoal.priority);
  };

  const handleSaveTask = () => {
    if (!editingTaskId || !editTaskTitle.trim()) return;
    onUpdateShortGoal(milestone.id, editingTaskId, {
      title: editTaskTitle.trim(),
      estimatedTime: editTaskMinutes ? Number(editTaskMinutes) : undefined,
      priority: editTaskPriority,
    });
    setEditingTaskId(null);
    setEditTaskTitle('');
    setEditTaskMinutes('');
    setEditTaskPriority('medium');
  };

  const editingTask = editingTaskId
    ? milestone.shortGoals.find(shortGoal => shortGoal.id === editingTaskId)
    : null;

  return (
    <div className="app-card overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={() => onToggleExpand(milestone.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggleExpand(milestone.id);
          }
        }}
        className="w-full p-4 flex items-start justify-between gap-3 transition-all duration-150 cursor-pointer"
      >
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-start gap-3 mb-2 min-w-0">
            <Checkbox checked={progress === 100} className="pointer-events-none" style={{ borderColor: progress === 100 ? 'var(--green-4)' : 'var(--divider)', backgroundColor: progress === 100 ? 'var(--green-4)' : 'transparent' }} />
            <div className="min-w-0 flex-1">
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.25, wordBreak: 'break-word' }}>{milestone.title}</h4>
            </div>
          </div>
          <div className="ml-7">
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{completedCount}/{totalCount}</span>
              <span style={{ fontSize: '12px', color: 'var(--green-5)', fontWeight: 600 }}>{Math.round(progress)}%</span>
            </div>
            <div className="progress-track" style={{ height: '6px' }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid var(--divider)' }}>
          <div className="flex items-center justify-between pt-1.5">
            <div className="min-w-0">
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, letterSpacing: '0.01em', lineHeight: 1 }}>
                Tasks
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsManaging(true)}
              className="transition-all duration-150"
              style={{
                height: '28px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '0 2px',
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: 1,
                color: 'var(--text-muted)',
                backgroundColor: 'transparent',
                opacity: isRewardClaimed ? 0.45 : 1,
              }}
              aria-label="Manage milestone"
              disabled={isRewardClaimed}
            >
              <Settings2 size={12} />
              Manage
            </button>
          </div>
          {milestone.shortGoals.length > 0 ? (
            <div className="app-card-muted overflow-hidden">
              {milestone.shortGoals.map((shortGoal, index) => (
                <div
                  key={shortGoal.id}
                  className="flex items-center gap-3 p-3"
                  style={{
                    borderTop: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    backgroundColor: 'transparent',
                  }}
                >
                  <Checkbox
                    checked={shortGoal.completed}
                    disabled={isRewardClaimed}
                    onCheckedChange={() => onToggleShortGoal(milestone.id, shortGoal.id)}
                    style={{
                      borderColor: shortGoal.completed ? 'var(--green-4)' : 'var(--divider)',
                      backgroundColor: shortGoal.completed ? 'var(--green-4)' : 'transparent',
                      opacity: isRewardClaimed ? 0.72 : 1,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: '14px', color: shortGoal.completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: shortGoal.completed ? 'line-through' : 'none', opacity: shortGoal.completed ? 0.65 : 1, fontWeight: 500 }}>
                      {shortGoal.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {shortGoal.estimatedTime && <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}><Clock size={12} style={{ color: 'var(--text-muted)', display: 'inline', marginRight: 4 }} />{shortGoal.estimatedTime} min</span>}
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{shortGoal.priority}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="app-card-muted p-3" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                No tasks yet
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Add the first task from Manage when you're ready.
              </p>
            </div>
          )}

        </div>
      )}

      <Dialog open={editingTaskId !== null} onOpenChange={(open) => !open && setEditingTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update this milestone task.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={editTaskTitle}
              onChange={(event) => setEditTaskTitle(event.target.value)}
              placeholder="Task title"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                type="number"
                min="0"
                value={editTaskMinutes}
                onChange={(event) => setEditTaskMinutes(event.target.value)}
                placeholder="Minutes"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }}
              />
              <Select value={editTaskPriority} onValueChange={(value) => setEditTaskPriority(value as TaskPriority)}>
                <SelectTrigger
                  className="rounded-lg"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--divider)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--divider)', color: 'var(--text-primary)' }}>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingTask && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Editing {editingTask.title}
              </p>
            )}
            <button onClick={handleSaveTask} className="primary-button w-full rounded-xl transition-all duration-150" style={{ height: '42px', fontSize: '14px', fontWeight: 700 }}>
              Save Task
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isManaging} onOpenChange={setIsManaging}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Milestone</DialogTitle>
            <DialogDescription>
              {milestone.title} · {milestone.shortGoals.length} task{milestone.shortGoals.length === 1 ? '' : 's'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Tasks
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Create and manage milestone tasks
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingTask((prev) => !prev)}
                className="rounded-lg transition-all duration-150 px-3"
                style={{
                  height: '36px',
                  fontSize: '13px',
                  fontWeight: 700,
                  flexShrink: 0,
                  backgroundColor: 'rgba(72, 187, 120, 0.14)',
                  border: '1px solid rgba(72, 187, 120, 0.22)',
                  color: 'var(--green-5)',
                  boxShadow: 'none',
                  opacity: isRewardClaimed ? 0.45 : 1,
                }}
                disabled={isRewardClaimed}
              >
                {isCreatingTask ? 'Close' : 'Add Task'}
              </button>
            </div>

            {isCreatingTask && (
              <div className="app-card-muted p-2.5 space-y-2">
                <Input
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  placeholder="Task title"
                  style={{ backgroundColor: 'transparent', border: '1px solid var(--divider)', color: 'var(--text-primary)', fontSize: '14px' }}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="number"
                    min="0"
                    value={newTaskMinutes}
                    onChange={(event) => setNewTaskMinutes(event.target.value)}
                    placeholder="Min"
                    style={{ backgroundColor: 'transparent', border: '1px solid var(--divider)', color: 'var(--text-primary)', fontSize: '14px', width: '100%' }}
                  />
                  <Select value={newTaskPriority} onValueChange={(value) => setNewTaskPriority(value as TaskPriority)}>
                    <SelectTrigger
                      className="rounded-lg"
                      style={{
                        height: '38px',
                        minWidth: 0,
                        flex: 1,
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderColor: 'var(--divider)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                      }}
                    >
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--divider)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={handleAddShortGoal}
                    className="rounded-lg transition-all duration-150"
                    style={{
                      height: '38px',
                      minWidth: '54px',
                      padding: '0 12px',
                      fontSize: '13px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(72, 187, 120, 0.14)',
                      border: '1px solid rgba(72, 187, 120, 0.22)',
                      color: 'var(--green-5)',
                      boxShadow: 'none',
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {!isCreatingTask && (
              <div
                className="space-y-2"
                style={{
                  maxHeight: '320px',
                  overflowY: 'auto',
                  paddingRight: '2px',
                }}
              >
                {milestone.shortGoals.length > 0 ? (
                  milestone.shortGoals.map(shortGoal => (
                    <div key={`manage-${shortGoal.id}`} className="app-card-muted p-2.5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, wordBreak: 'break-word' }}>
                          {shortGoal.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          {shortGoal.estimatedTime && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{shortGoal.estimatedTime} min</span>}
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{shortGoal.priority}</span>
                        </div>
                      </div>
                      <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsManaging(false);
                            openEditTask(shortGoal);
                          }}
                          className="rounded-lg transition-all duration-150 px-3"
                          style={{
                            height: '34px',
                            fontSize: '12px',
                            backgroundColor: 'rgba(96, 165, 250, 0.14)',
                            border: '1px solid rgba(96, 165, 250, 0.22)',
                            color: '#93c5fd',
                            boxShadow: 'none',
                            opacity: isRewardClaimed ? 0.45 : 1,
                          }}
                          disabled={isRewardClaimed}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteShortGoal(milestone.id, shortGoal.id)}
                          className="rounded-lg transition-all duration-150 px-3"
                          style={{
                            height: '34px',
                            fontSize: '12px',
                            backgroundColor: 'rgba(212, 24, 61, 0.12)',
                            border: '1px solid rgba(212, 24, 61, 0.2)',
                            color: '#fb7185',
                            boxShadow: 'none',
                            opacity: isRewardClaimed ? 0.45 : 1,
                          }}
                          disabled={isRewardClaimed}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="app-card-muted p-3" style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>No tasks yet</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Add the first one when you're ready.</p>
                  </div>
                )}
              </div>
            )}

            {isRewardClaimed ? (
              <button
                type="button"
                onClick={() => setIsManaging(false)}
                className="rounded-xl transition-all duration-150 px-4 w-full"
                style={{
                  height: '42px',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(72, 187, 120, 0.14)',
                  border: '1px solid rgba(72, 187, 120, 0.22)',
                  color: 'var(--green-5)',
                  boxShadow: 'none',
                }}
              >
                Done
              </button>
            ) : (
              <div className="responsive-two-col">
              <button
                type="button"
                onClick={() => {
                  setIsManaging(false);
                  onDeleteMilestone(milestone.id);
                }}
                className="rounded-xl transition-all duration-150 px-4 w-full"
                style={{
                  height: '42px',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(212, 24, 61, 0.12)',
                  border: '1px solid rgba(212, 24, 61, 0.2)',
                  color: '#fb7185',
                  boxShadow: 'none',
                }}
              >
                Delete Milestone
              </button>
              <button
                type="button"
                onClick={() => setIsManaging(false)}
                className="rounded-xl transition-all duration-150 px-4 w-full"
                style={{
                  height: '42px',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(72, 187, 120, 0.14)',
                  border: '1px solid rgba(72, 187, 120, 0.22)',
                  color: 'var(--green-5)',
                  boxShadow: 'none',
                }}
              >
                Done
              </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
