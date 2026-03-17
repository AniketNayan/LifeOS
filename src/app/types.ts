export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  estimatedTime?: number; // in minutes
  priority: TaskPriority;
  date: string; // ISO date string
  goalId?: string;
  milestoneId?: string;
}

export interface TopTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface DailyRecord {
  date: string; // ISO date string
  mainFocus: string;
  topTasks: TopTask[];
  dailyTasks: Task[];
  productivityScore: number; // 0-10
  deepWorkHours: number;
  healthDone: boolean;
  distractionFree: boolean;
  workNotes: string;
  personalThoughts: string;
  lessonsLearned: string;
  goalContributions: number;
}

export interface ShortGoal {
  id: string;
  title: string;
  completed: boolean;
  estimatedTime?: number;
  priority: TaskPriority;
}

export interface Milestone {
  id: string;
  title: string;
  shortGoals: ShortGoal[];
  goalId: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  targetDate?: string;
  reward?: string;
  status: 'active' | 'future' | 'completed';
  milestones: Milestone[];
  rewardClaimed?: boolean;
  contributionDays: number;
  createdAt: string;
}

export interface HeatmapDay {
  date: string;
  score: number;
  tasksCompleted: number;
  goalContributions: number;
}
