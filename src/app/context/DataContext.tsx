import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Goal, Task, HeatmapDay, DailyRecord, TopTask, Milestone } from '../types';
import { useAuth } from './AuthContext';
import { getLocalDateKey } from '../lib/date';

interface DataContextType {
  goals: Goal[];
  tasks: Task[];
  heatmapData: HeatmapDay[];
  dailyRecords: Record<string, DailyRecord>;
  fetchGoals: (query?: Record<string, string | number | boolean | undefined>) => Promise<Goal[]>;
  fetchTasks: (query?: Record<string, string | number | boolean | undefined>) => Promise<Task[]>;
  fetchGoalsPage: (query?: Record<string, string | number | boolean | undefined>) => Promise<{ items: Goal[]; pagination?: { page: number; pageSize: number; total: number; totalPages: number } }>;
  fetchTasksPage: (query?: Record<string, string | number | boolean | undefined>) => Promise<{ items: Task[]; pagination?: { page: number; pageSize: number; total: number; totalPages: number } }>;
  
  // Daily Record methods
  getDailyRecord: (date: string) => DailyRecord;
  updateDailyRecord: (date: string, updates: Partial<DailyRecord>) => Promise<void>;
  
  // Goal methods
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  
  // Milestone methods
  addMilestone: (goalId: string, milestone: Milestone) => Promise<void>;
  updateMilestone: (goalId: string, milestoneId: string, updates: Partial<Milestone>) => Promise<void>;
  deleteMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  addShortGoal: (goalId: string, milestoneId: string, shortGoal: Milestone['shortGoals'][number]) => Promise<void>;
  updateShortGoal: (goalId: string, milestoneId: string, shortGoalId: string, updates: Partial<Milestone['shortGoals'][number]>) => Promise<void>;
  deleteShortGoal: (goalId: string, milestoneId: string, shortGoalId: string) => Promise<void>;
  
  // Task methods
  addTask: (task: Task) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  toggleShortGoal: (goalId: string, milestoneId: string, shortGoalId: string) => Promise<void>;
  
  // Reward
  claimReward: (goalId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const createUserStorageKey = (userId: string) => `lifeos_data:${userId}`;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const createEmptyDailyRecord = (date: string): DailyRecord => ({
  date,
  mainFocus: '',
  topTasks: [
    { id: '1', title: '', completed: false },
    { id: '2', title: '', completed: false },
    { id: '3', title: '', completed: false },
  ],
  dailyTasks: [],
  productivityScore: 5,
  deepWorkHours: 0,
  healthDone: false,
  distractionFree: false,
  workNotes: '',
  personalThoughts: '',
  lessonsLearned: '',
  goalContributions: 0,
});

const normalizeTask = (task: any): Task => ({
  ...task,
  date: typeof task.date === 'string' ? task.date.split('T')[0] : task.date,
  goalId: task.goalId || undefined,
  milestoneId: task.milestoneId || undefined,
  estimatedTime: task.estimatedTime ?? undefined,
});

const normalizeGoal = (goal: any): Goal => ({
  ...goal,
  createdAt: typeof goal.createdAt === 'string' ? goal.createdAt.split('T')[0] : goal.createdAt,
  startDate: typeof goal.startDate === 'string' ? goal.startDate.split('T')[0] : undefined,
  targetDate: typeof goal.targetDate === 'string' ? goal.targetDate.split('T')[0] : undefined,
  reward: goal.reward || undefined,
  milestones: (goal.milestones || []).map((milestone: any) => ({
    ...milestone,
    shortGoals: milestone.shortGoals || [],
  })),
});

const normalizeDailyRecord = (record: any): DailyRecord => ({
  date: typeof record.date === 'string' ? record.date.split('T')[0] : record.date,
  mainFocus: record.mainFocus ?? '',
  topTasks: Array.isArray(record.topTasks) ? record.topTasks : createEmptyDailyRecord(typeof record.date === 'string' ? record.date.split('T')[0] : record.date).topTasks,
  dailyTasks: [],
  productivityScore: record.productivityScore ?? 5,
  deepWorkHours: record.deepWorkHours ?? 0,
  healthDone: record.healthDone ?? false,
  distractionFree: record.distractionFree ?? false,
  workNotes: record.workNotes ?? '',
  personalThoughts: record.personalThoughts ?? '',
  lessonsLearned: record.lessonsLearned ?? '',
  goalContributions: record.goalContributions ?? 0,
});

const buildHeatmapData = (tasks: Task[], dailyRecords: Record<string, DailyRecord>): HeatmapDay[] => {
  const dates = new Set<string>([
    ...tasks.map((task) => task.date),
    ...Object.keys(dailyRecords),
  ]);

  return Array.from(dates)
    .sort((a, b) => a.localeCompare(b))
    .map((date) => {
      const record = dailyRecords[date];
      const tasksForDate = tasks.filter((task) => task.date === date);
      return {
        date,
        score: record?.productivityScore ?? 0,
        tasksCompleted: tasksForDate.filter((task) => task.completed).length,
        goalContributions: record?.goalContributions ?? 0,
      };
    });
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { currentUser, isReady } = useAuth();
  const storageKey = useMemo(() => (currentUser ? createUserStorageKey(currentUser.id) : null), [currentUser]);
  const createDefaultState = () => ({
    goals: [] as Goal[],
    tasks: [] as Task[],
    dailyRecords: {} as Record<string, DailyRecord>,
  });

  const [goals, setGoals] = useState<Goal[]>(() => createDefaultState().goals);
  const [tasks, setTasks] = useState<Task[]>(() => createDefaultState().tasks);
  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyRecord>>(() => createDefaultState().dailyRecords);
  const [isHydrated, setIsHydrated] = useState(false);
  const dailyRecordSyncTimers = useRef<Record<string, number>>({});
  const pendingDailyRecordPayloads = useRef<Record<string, DailyRecord>>({});
  const lastSyncedDailyRecordPayloads = useRef<Record<string, string>>({});
  const heatmapData = useMemo(() => buildHeatmapData(tasks, dailyRecords), [tasks, dailyRecords]);

  const apiFetch = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  };

  const buildQueryString = (query?: Record<string, string | number | boolean | undefined>) => {
    if (!query) {
      return '';
    }

    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    });

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  const fetchGoals = async (query?: Record<string, string | number | boolean | undefined>) => {
    const response = await apiFetch<any[] | { items: any[] }>(`/goals${buildQueryString(query)}`);
    const items = Array.isArray(response) ? response : response.items;
    return items.map(normalizeGoal);
  };

  const fetchTasks = async (query?: Record<string, string | number | boolean | undefined>) => {
    const response = await apiFetch<any[] | { items: any[] }>(`/tasks${buildQueryString(query)}`);
    const items = Array.isArray(response) ? response : response.items;
    return items.map(normalizeTask);
  };

  const fetchGoalsPage = async (query?: Record<string, string | number | boolean | undefined>) => {
    const response = await apiFetch<any[] | { items: any[]; pagination?: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/goals${buildQueryString(query)}`,
    );
    if (Array.isArray(response)) {
      return { items: response.map(normalizeGoal) };
    }
    return {
      items: response.items.map(normalizeGoal),
      pagination: response.pagination,
    };
  };

  const fetchTasksPage = async (query?: Record<string, string | number | boolean | undefined>) => {
    const response = await apiFetch<any[] | { items: any[]; pagination?: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/tasks${buildQueryString(query)}`,
    );
    if (Array.isArray(response)) {
      return { items: response.map(normalizeTask) };
    }
    return {
      items: response.items.map(normalizeTask),
      pagination: response.pagination,
    };
  };

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      setIsHydrated(false);

      if (!storageKey) {
        const defaults = createDefaultState();
        if (!cancelled) {
          setGoals(defaults.goals);
          setTasks(defaults.tasks);
          setDailyRecords(defaults.dailyRecords);
          setIsHydrated(true);
        }
        return;
      }

      try {
        const [remoteGoals, remoteTasks, remoteDailyRecords] = await Promise.all([
          fetchGoals(),
          fetchTasks(),
          apiFetch<any[]>('/daily-records'),
        ]);

        if (cancelled) {
          return;
        }

        setGoals(remoteGoals);
        setTasks(remoteTasks);
        setDailyRecords(
          remoteDailyRecords.reduce<Record<string, DailyRecord>>((acc, record) => {
            const normalized = normalizeDailyRecord(record);
            acc[normalized.date] = normalized;
            return acc;
          }, {}),
        );
      } catch {
        if (cancelled) {
          return;
        }

        const defaults = createDefaultState();
        setGoals(defaults.goals);
        setTasks(defaults.tasks);
        setDailyRecords(defaults.dailyRecords);
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [isReady, storageKey]);

  const getDailyRecord = (date: string): DailyRecord => {
    if (dailyRecords[date]) {
      return dailyRecords[date];
    }
    return createEmptyDailyRecord(date);
  };

  const updateDailyRecord = async (date: string, updates: Partial<DailyRecord>) => {
    const today = getLocalDateKey();
    
    // Only allow editing today or future dates
    if (date < today) {
      console.warn('Cannot edit past daily records');
      return;
    }

    const payload = {
      ...getDailyRecord(date),
      ...updates,
    };

    setDailyRecords((prev) => ({
      ...prev,
      [date]: payload,
    }));

    pendingDailyRecordPayloads.current[date] = payload;

    const existingTimer = dailyRecordSyncTimers.current[date];
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    dailyRecordSyncTimers.current[date] = window.setTimeout(async () => {
      try {
        const latestPayload = pendingDailyRecordPayloads.current[date] ?? payload;
        const serializedPayload = JSON.stringify(latestPayload);
        if (lastSyncedDailyRecordPayloads.current[date] === serializedPayload) {
          return;
        }

        const updatedRecord = await apiFetch<any>(`/daily-records/${date}`, {
          method: 'PUT',
          body: JSON.stringify({
            mainFocus: latestPayload.mainFocus,
            topTasks: latestPayload.topTasks,
            productivityScore: latestPayload.productivityScore,
            deepWorkHours: latestPayload.deepWorkHours,
            healthDone: latestPayload.healthDone,
            distractionFree: latestPayload.distractionFree,
            workNotes: latestPayload.workNotes,
            personalThoughts: latestPayload.personalThoughts,
            lessonsLearned: latestPayload.lessonsLearned,
            goalContributions: latestPayload.goalContributions,
          }),
        });

        const normalized = normalizeDailyRecord(updatedRecord);
        lastSyncedDailyRecordPayloads.current[date] = JSON.stringify(normalized);
        const pendingNow = JSON.stringify(pendingDailyRecordPayloads.current[date] ?? latestPayload);
        if (pendingNow === serializedPayload) {
          setDailyRecords((prev) => ({
            ...prev,
            [date]: normalized,
          }));
        }
      } catch (error) {
        console.error('Failed to sync daily record', error);
      }
    }, 800);
  };

  const addGoal = async (goal: Goal) => {
    const previousGoals = goals;
    setGoals((prev) => [...prev, goal]);

    try {
      const createdGoal = await apiFetch<any>('/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: goal.title,
          description: goal.description,
          startDate: goal.startDate,
          targetDate: goal.targetDate,
          reward: goal.reward,
          status: goal.status,
        }),
      });

      setGoals((prev) => prev.map((item) => item.id === goal.id ? normalizeGoal(createdGoal) : item));
    } catch (error) {
      console.error('Failed to add goal', error);
      setGoals(previousGoals);
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    const previousGoals = goals;
    setGoals((prev) => prev.map((goal) => goal.id === goalId ? { ...goal, ...updates } : goal));

    try {
      const updatedGoal = await apiFetch<any>(`/goals/${goalId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      setGoals((prev) => prev.map((goal) => goal.id === goalId ? normalizeGoal(updatedGoal) : goal));
    } catch (error) {
      console.error('Failed to update goal', error);
      setGoals(previousGoals);
    }
  };

  const deleteGoal = async (goalId: string) => {
    const previousGoals = goals;
    const previousTasks = tasks;
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    setTasks((prev) => prev.filter((task) => task.goalId !== goalId));

    try {
      await apiFetch<{ success: boolean }>(`/goals/${goalId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete goal', error);
      setGoals(previousGoals);
      setTasks(previousTasks);
    }
  };

  const addMilestone = async (goalId: string, milestone: Milestone) => {
    const previousGoals = goals;
    setGoals((prev) => prev.map((goal) => (
      goal.id === goalId
        ? { ...goal, milestones: [...goal.milestones, milestone] }
        : goal
    )));

    try {
      const createdMilestone = await apiFetch<any>(`/goals/${goalId}/milestones`, {
        method: 'POST',
        body: JSON.stringify({ title: milestone.title }),
      });

      setGoals((prev) => prev.map((goal) => (
        goal.id === goalId
          ? {
              ...goal,
              milestones: goal.milestones.map((item) => item.id === milestone.id
                ? { ...createdMilestone, shortGoals: createdMilestone.shortGoals || [] }
                : item
              ),
            }
          : goal
      )));
    } catch (error) {
      console.error('Failed to add milestone', error);
      setGoals(previousGoals);
    }
  };

  const updateMilestone = async (goalId: string, milestoneId: string, updates: Partial<Milestone>) => {
    const previousGoals = goals;
    setGoals((prev) => prev.map((goal) => (
      goal.id === goalId
        ? {
            ...goal,
            milestones: goal.milestones.map((milestone) => milestone.id === milestoneId ? { ...milestone, ...updates } : milestone),
          }
        : goal
    )));

    try {
      const updatedMilestone = await apiFetch<any>(`/goals/${goalId}/milestones/${milestoneId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      setGoals((prev) => prev.map((goal) => (
        goal.id === goalId
          ? {
              ...goal,
              milestones: goal.milestones.map((milestone) => milestone.id === milestoneId ? { ...updatedMilestone, shortGoals: updatedMilestone.shortGoals || [] } : milestone),
            }
          : goal
      )));
    } catch (error) {
      console.error('Failed to update milestone', error);
      setGoals(previousGoals);
    }
  };

  const deleteMilestone = async (goalId: string, milestoneId: string) => {
    const previousGoals = goals;
    const previousTasks = tasks;
    setGoals((prev) => prev.map((goal) => (
      goal.id === goalId
        ? { ...goal, milestones: goal.milestones.filter((milestone) => milestone.id !== milestoneId) }
        : goal
    )));
    setTasks((prev) => prev.filter((task) => task.milestoneId !== milestoneId));

    try {
      await apiFetch<{ success: boolean }>(`/goals/${goalId}/milestones/${milestoneId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete milestone', error);
      setGoals(previousGoals);
      setTasks(previousTasks);
    }
  };

  const addShortGoal = async (goalId: string, milestoneId: string, shortGoal: Milestone['shortGoals'][number]) => {
    const previousGoals = goals;
    setGoals((prev) => prev.map((goal) => (
      goal.id === goalId
        ? {
            ...goal,
            milestones: goal.milestones.map((milestone) => (
              milestone.id === milestoneId
                ? { ...milestone, shortGoals: [...milestone.shortGoals, shortGoal] }
                : milestone
            )),
          }
        : goal
    )));

    try {
      const createdShortGoal = await apiFetch<any>(`/goals/${goalId}/milestones/${milestoneId}/short-goals`, {
        method: 'POST',
        body: JSON.stringify(shortGoal),
      });

      setGoals((prev) => prev.map((goal) => (
        goal.id === goalId
          ? {
              ...goal,
              milestones: goal.milestones.map((milestone) => (
                milestone.id === milestoneId
                  ? { ...milestone, shortGoals: milestone.shortGoals.map((item) => item.id === shortGoal.id ? createdShortGoal : item) }
                  : milestone
              )),
            }
          : goal
      )));
    } catch (error) {
      console.error('Failed to add milestone task', error);
      setGoals(previousGoals);
    }
  };

  const updateShortGoal = async (goalId: string, milestoneId: string, shortGoalId: string, updates: Partial<Milestone['shortGoals'][number]>) => {
    const previousGoals = goals;
    setGoals((prev) => prev.map((goal) => (
      goal.id === goalId
        ? {
            ...goal,
            milestones: goal.milestones.map((milestone) => (
              milestone.id === milestoneId
                ? {
                    ...milestone,
                    shortGoals: milestone.shortGoals.map((shortGoal) => shortGoal.id === shortGoalId ? { ...shortGoal, ...updates } : shortGoal),
                  }
                : milestone
            )),
          }
        : goal
    )));

    try {
      const updatedShortGoal = await apiFetch<any>(`/goals/${goalId}/milestones/${milestoneId}/short-goals/${shortGoalId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      setGoals((prev) => prev.map((goal) => (
        goal.id === goalId
          ? {
              ...goal,
              milestones: goal.milestones.map((milestone) => (
                milestone.id === milestoneId
                  ? {
                      ...milestone,
                      shortGoals: milestone.shortGoals.map((shortGoal) => shortGoal.id === shortGoalId ? updatedShortGoal : shortGoal),
                    }
                  : milestone
              )),
            }
          : goal
      )));
    } catch (error) {
      console.error('Failed to update milestone task', error);
      setGoals(previousGoals);
    }
  };

  const deleteShortGoal = async (goalId: string, milestoneId: string, shortGoalId: string) => {
    const previousGoals = goals;
    setGoals((prev) => prev.map((goal) => (
      goal.id === goalId
        ? {
            ...goal,
            milestones: goal.milestones.map((milestone) => (
              milestone.id === milestoneId
                ? { ...milestone, shortGoals: milestone.shortGoals.filter((shortGoal) => shortGoal.id !== shortGoalId) }
                : milestone
            )),
          }
        : goal
    )));

    try {
      await apiFetch<{ success: boolean }>(`/goals/${goalId}/milestones/${milestoneId}/short-goals/${shortGoalId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete milestone task', error);
      setGoals(previousGoals);
    }
  };

  const addTask = async (task: Task) => {
    const previousTasks = tasks;
    setTasks((prev) => [...prev, task]);

    try {
      const createdTask = await apiFetch<any>('/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      });

      setTasks((prev) => prev.map((item) => item.id === task.id ? normalizeTask(createdTask) : item));
    } catch (error) {
      console.error('Failed to add task', error);
      setTasks(previousTasks);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const previousTasks = tasks;
    setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, ...updates } : task));

    try {
      const updatedTask = await apiFetch<any>(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      setTasks((prev) => prev.map((task) => task.id === taskId ? normalizeTask(updatedTask) : task));
    } catch (error) {
      console.error('Failed to update task', error);
      setTasks(previousTasks);
    }
  };

  const deleteTask = async (taskId: string) => {
    const previousTasks = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    try {
      await apiFetch<{ success: boolean }>(`/tasks/${taskId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete task', error);
      setTasks(previousTasks);
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const today = getLocalDateKey();
    
    // Only allow toggling tasks for today or future
    if (task.date < today) {
      console.warn('Cannot edit past tasks');
      return;
    }

    const previousTasks = tasks;
    const newCompleted = !task.completed;
    setTasks((prev) => prev.map((currentTask) => currentTask.id === taskId ? { ...currentTask, completed: newCompleted } : currentTask));

    // Update heatmap and daily record
    if (task.goalId && task.date === today) {
      // Update goal contribution days
      setGoals(prev => prev.map(g => {
        if (g.id === task.goalId) {
          return { ...g, contributionDays: Math.max(g.contributionDays + (newCompleted ? 1 : -1), 0) };
        }
        return g;
      }));

      // Update daily record
      const record = getDailyRecord(today);
      await updateDailyRecord(today, {
        goalContributions: Math.max(record.goalContributions + (newCompleted ? 1 : -1), 0),
      });
    }

    try {
      const toggledTask = await apiFetch<any>(`/tasks/${taskId}/toggle`, {
        method: 'POST',
      });
      const normalizedTask = normalizeTask(toggledTask);

      setTasks((prev) => prev.map((currentTask) => currentTask.id === taskId ? normalizedTask : currentTask));
    } catch (error) {
      console.error('Failed to toggle task', error);
      setTasks(previousTasks);
    }
  };

  const toggleShortGoal = async (goalId: string, milestoneId: string, shortGoalId: string) => {
    const goal = goals.find((item) => item.id === goalId);
    const milestone = goal?.milestones.find((item) => item.id === milestoneId);
    const shortGoal = milestone?.shortGoals.find((item) => item.id === shortGoalId);
    if (!shortGoal) return;

    const nextCompleted = !shortGoal.completed;

    setGoals((prev) => prev.map((currentGoal) => (
      currentGoal.id === goalId
        ? {
            ...currentGoal,
            milestones: currentGoal.milestones.map((currentMilestone) => (
              currentMilestone.id === milestoneId
                ? {
                    ...currentMilestone,
                    shortGoals: currentMilestone.shortGoals.map((currentShortGoal) => (
                      currentShortGoal.id === shortGoalId
                        ? { ...currentShortGoal, completed: nextCompleted }
                        : currentShortGoal
                    )),
                  }
                : currentMilestone
            )),
          }
        : currentGoal
    )));

    await updateShortGoal(goalId, milestoneId, shortGoalId, {
      completed: nextCompleted,
    });
  };

  const claimReward = async (goalId: string) => {
    const previousGoals = goals;
    setGoals((prev) => prev.map((goal) => goal.id === goalId ? { ...goal, rewardClaimed: true } : goal));

    try {
      const updatedGoal = await apiFetch<any>(`/goals/${goalId}/claim-reward`, {
        method: 'POST',
      });

      setGoals((prev) => prev.map((goal) => goal.id === goalId ? normalizeGoal(updatedGoal) : goal));
    } catch (error) {
      console.error('Failed to claim reward', error);
      setGoals(previousGoals);
    }
  };

  return (
    <DataContext.Provider value={{
      goals,
      tasks,
      heatmapData,
      dailyRecords,
      fetchGoals,
      fetchTasks,
      fetchGoalsPage,
      fetchTasksPage,
      getDailyRecord,
      updateDailyRecord,
      addGoal,
      updateGoal,
      deleteGoal,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      addShortGoal,
      updateShortGoal,
      deleteShortGoal,
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      toggleShortGoal,
      claimReward,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
