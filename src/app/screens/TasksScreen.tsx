import { useEffect, useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { Checkbox } from '../components/ui/checkbox';
import { SettingsButton } from '../components/SettingsButton';
import { CalendarDays, Clock, CircleCheck, Plus, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Task, TaskPriority } from '../types';

export function TasksScreen() {
  const { fetchTasksPage, toggleTask, addTask, updateTask, deleteTask } = useData();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskView, setTaskView] = useState<'all' | 'pending' | 'active' | 'future'>('all');
  const [visibleTasks, setVisibleTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskPagination, setTaskPagination] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
  const [taskPage, setTaskPage] = useState(1);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskMinutes, setNewTaskMinutes] = useState('30');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const loadTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const query =
        taskView === 'pending'
          ? { completed: false, to: today, page: taskPage, pageSize: 20 }
          : taskView === 'active'
            ? { date: today, page: taskPage, pageSize: 20 }
            : taskView === 'future'
              ? { from: tomorrow, page: taskPage, pageSize: 20 }
              : { page: taskPage, pageSize: 20 };

      const { items, pagination } = await fetchTasksPage(query);
      setVisibleTasks(items);
      setTaskPagination(pagination ?? null);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    setTaskPage(1);
  }, [taskView]);

  useEffect(() => {
    void loadTasks();
  }, [taskPage, taskView]);

  const todayTasks = visibleTasks.filter(t => t.date === today);
  const pendingToday = todayTasks.filter(t => !t.completed);
  const doneToday = todayTasks.filter(t => t.completed);
  const futureTasks = visibleTasks.filter(t => t.date > today);
  const pendingTasks = visibleTasks.filter(t => !t.completed && t.date <= today);

  const groupedFutureTasks = Object.entries(
    futureTasks.reduce((acc, task) => {
      if (!acc[task.date]) acc[task.date] = [];
      acc[task.date].push(task);
      return acc;
    }, {} as Record<string, typeof futureTasks>)
  ).sort(([a], [b]) => a.localeCompare(b));

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    await addTask({
      id: `t${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
      estimatedTime: newTaskMinutes ? Number(newTaskMinutes) : undefined,
      priority: newTaskPriority,
      date: newTaskDate,
    });

    setNewTaskTitle('');
    setNewTaskDate(today);
    setNewTaskMinutes('30');
    setNewTaskPriority('medium');
    setIsAddingTask(false);
    await loadTasks();
  };

  const handleSaveTask = async () => {
    if (!editingTask || !newTaskTitle.trim()) return;

    await updateTask(editingTask.id, {
      title: newTaskTitle.trim(),
      date: newTaskDate,
      estimatedTime: newTaskMinutes ? Number(newTaskMinutes) : undefined,
      priority: newTaskPriority,
    });

    setEditingTask(null);
    setNewTaskTitle('');
    setNewTaskDate(today);
    setNewTaskMinutes('30');
    setNewTaskPriority('medium');
    await loadTasks();
  };

  const handleToggleTask = async (taskId: string) => {
    await toggleTask(taskId);
    await loadTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    await loadTasks();
  };

  const emptyLabel = useMemo(() => {
    if (isLoadingTasks) return 'Loading tasks...';
    return '';
  }, [isLoadingTasks]);

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDate(task.date);
    setNewTaskMinutes(task.estimatedTime ? String(task.estimatedTime) : '');
    setNewTaskPriority(task.priority);
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header-panel">
          <div className="page-header-main">
            <div className="page-header-copy">
              <h1 className="page-header-title">Execution board</h1>
              <p className="page-header-subtitle">
                Organize what is pending, completed, and coming up next.
              </p>
            </div>
            <div className="page-header-actions">
              <SettingsButton />
              <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
                <DialogTrigger asChild>
                  <button className="page-header-action" aria-label="Add task">
                    <Plus size={16} />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Task</DialogTitle>
                    <DialogDescription>Create a task for today or a future date.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="app-card-muted p-3 space-y-3">
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Task
                        </label>
                        <Input
                          placeholder="Task title"
                          value={newTaskTitle}
                          onChange={(event) => setNewTaskTitle(event.target.value)}
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            color: 'var(--text-primary)',
                            height: '44px',
                            fontSize: '15px',
                          }}
                        />
                      </div>
                      <div className="responsive-form-grid">
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Date
                          </label>
                          <Input
                            type="date"
                            value={newTaskDate}
                            onChange={(event) => setNewTaskDate(event.target.value)}
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              color: 'var(--text-primary)',
                              height: '42px',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Minutes
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={newTaskMinutes}
                            onChange={(event) => setNewTaskMinutes(event.target.value)}
                            placeholder="Minutes"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              color: 'var(--text-primary)',
                              height: '42px',
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Priority
                        </label>
                        <Select value={newTaskPriority} onValueChange={(value) => setNewTaskPriority(value as TaskPriority)}>
                          <SelectTrigger
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.02)',
                              borderColor: 'rgba(255,255,255,0.07)',
                              color: 'var(--text-primary)',
                              height: '42px',
                              fontSize: '15px',
                            }}
                          >
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <button onClick={handleAddTask} className="primary-button w-full rounded-xl transition-all duration-150" style={{ height: '42px', fontSize: '14px', fontWeight: 700 }}>
                      Add Task
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div
          className="app-card"
          style={{
            padding: '6px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '6px',
          }}
        >
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'active', label: 'Active' },
            { key: 'future', label: 'Future' },
          ].map((option) => {
            const isActive = taskView === option.key;
            return (
              <button
                key={option.key}
                onClick={() => setTaskView(option.key as typeof taskView)}
                className="rounded-lg transition-all duration-150"
                style={{
                  height: '42px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--green-5)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(72, 187, 120, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(72, 187, 120, 0.18)' : '1px solid transparent',
                  boxShadow: 'none',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {taskView === 'all' && (
          <>
            <TaskSection title="Pending Today" empty={emptyLabel || 'No pending tasks'} tasks={pendingToday} onToggle={handleToggleTask} onEdit={openEditTask} onDelete={handleDeleteTask} />
            <TaskSection title="Completed Today" empty={emptyLabel || 'Nothing completed yet'} tasks={doneToday} onToggle={handleToggleTask} onEdit={openEditTask} onDelete={handleDeleteTask} />

            {groupedFutureTasks.length > 0 && (
              <section>
                <h2 className="compact-section-title" style={{ marginBottom: '10px' }}>Upcoming Dates</h2>
                <div className="space-y-3">
                  {groupedFutureTasks.map(([date, dateTasks]) => (
                    <div key={date} className="app-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={13} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <span className="metric-pill">{dateTasks.length} tasks</span>
                      </div>
                      <div className="space-y-2">
                          {dateTasks.map(task => (
                            <TaskItem key={task.id} task={task} onToggle={handleToggleTask} onEdit={openEditTask} onDelete={handleDeleteTask} />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {taskView === 'pending' && (
          <TaskSection title="Pending Tasks" empty={emptyLabel || 'No pending tasks'} tasks={pendingTasks} onToggle={handleToggleTask} onEdit={openEditTask} onDelete={handleDeleteTask} />
        )}

        {taskView === 'active' && (
          <>
            <TaskSection title="Today" empty={emptyLabel || 'No tasks for today'} tasks={todayTasks} onToggle={handleToggleTask} onEdit={openEditTask} onDelete={handleDeleteTask} />
          </>
        )}

        {taskView === 'future' && (
          groupedFutureTasks.length > 0 ? (
            <section>
              <h2 className="compact-section-title" style={{ marginBottom: '10px' }}>Future Tasks</h2>
              <div className="space-y-3">
                {groupedFutureTasks.map(([date, dateTasks]) => (
                  <div key={date} className="app-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <span className="metric-pill">{dateTasks.length} tasks</span>
                    </div>
                    <div className="space-y-2">
                      {dateTasks.map(task => (
                        <TaskItem key={task.id} task={task} onToggle={handleToggleTask} onEdit={openEditTask} onDelete={handleDeleteTask} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <TaskSection title="Future Tasks" empty={emptyLabel || 'No future tasks'} tasks={[]} onToggle={handleToggleTask} onEdit={openEditTask} onDelete={handleDeleteTask} />
          )
        )}

        <PaginationControls
          page={taskPagination?.page ?? taskPage}
          totalPages={taskPagination?.totalPages ?? 1}
          total={taskPagination?.total ?? visibleTasks.length}
          isLoading={isLoadingTasks}
          onPrevious={() => setTaskPage((page) => Math.max(1, page - 1))}
          onNext={() => setTaskPage((page) => Math.min(taskPagination?.totalPages ?? page, page + 1))}
        />
      </div>

      <Dialog open={editingTask !== null} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update this task.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="app-card-muted p-3 space-y-3">
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Task
                </label>
                <Input
                  placeholder="Task title"
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'var(--text-primary)',
                    height: '44px',
                    fontSize: '15px',
                  }}
                />
              </div>
              <div className="responsive-form-grid">
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Date
                  </label>
                  <Input
                    type="date"
                    value={newTaskDate}
                    onChange={(event) => setNewTaskDate(event.target.value)}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: 'var(--text-primary)',
                      height: '42px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Minutes
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={newTaskMinutes}
                    onChange={(event) => setNewTaskMinutes(event.target.value)}
                    placeholder="Minutes"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: 'var(--text-primary)',
                      height: '42px',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Priority
                </label>
                <Select value={newTaskPriority} onValueChange={(value) => setNewTaskPriority(value as TaskPriority)}>
                  <SelectTrigger
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      borderColor: 'rgba(255,255,255,0.07)',
                      color: 'var(--text-primary)',
                      height: '42px',
                      fontSize: '15px',
                    }}
                  >
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <button onClick={handleSaveTask} className="primary-button w-full rounded-xl transition-all duration-150" style={{ height: '42px', fontSize: '14px', fontWeight: 700 }}>
              Save Changes
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaginationControls({
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

  return (
    <div className="app-card p-3 flex items-center justify-between gap-3">
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        {total} item{total === 1 ? '' : 's'} · Page {page} of {Math.max(totalPages, 1)}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={page <= 1}
          className="page-header-action"
          style={{ minWidth: '36px', width: '36px', height: '36px', padding: 0 }}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="page-header-action"
          style={{ minWidth: '36px', width: '36px', height: '36px', padding: 0 }}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-card p-3">
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{value}</div>
    </div>
  );
}

function TaskSection({ title, tasks, empty, onToggle, onEdit, onDelete }: { title: string; tasks: Task[]; empty: string; onToggle: (id: string) => void; onEdit: (task: Task) => void; onDelete: (id: string) => void }) {
  return (
    <section>
      <h2 className="compact-section-title" style={{ marginBottom: '10px' }}>{title}</h2>
      {tasks.length > 0 ? (
        <div className="app-card" style={{ padding: '6px 16px' }}>
          {tasks.map((task, index) => (
            <TaskItem key={task.id} task={task} index={index} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="app-card p-4">
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{empty}</p>
        </div>
      )}
    </section>
  );
}

function TaskItem({ task, index, onToggle, onEdit, onDelete }: { task: Task; index: number; onToggle: (id: string) => void; onEdit: (task: Task) => void; onDelete: (id: string) => void }) {
  return (
    <div
      className="flex items-center gap-3 transition-all duration-150"
      style={{
        padding: '10px 0',
        borderTop: index === 0 ? '0' : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        style={{
          borderColor: 'var(--divider)',
          backgroundColor: task.completed ? 'rgba(255,255,255,0.06)' : 'transparent',
          color: task.completed ? 'var(--text-primary)' : 'inherit',
        }}
      />
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: '14px', color: 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.78 : 1 }}>
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          {task.estimatedTime && (
            <div className="flex items-center gap-1">
              <Clock size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{task.estimatedTime} min</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <CircleCheck size={11} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{task.priority}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="transition-all duration-150"
              style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
              aria-label="Task actions"
            >
              <MoreVertical size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--divider)' }}>
            <DropdownMenuItem onClick={() => onEdit(task)} style={{ color: 'var(--text-primary)' }}>
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task.id)} style={{ color: 'var(--destructive)' }}>
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
