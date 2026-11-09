export interface Course {
  id: number; title: string; description: string; version: number;
  createdAt: string; updatedAt: string; lessonIds: number[];
}
export interface Lesson {
  id: number; courseId: number; title: string; order: number;
  content: string; version: number; createdAt: string; updatedAt: string;
  testId: number;
}
export interface Question {
  id: number; testId: number; text: string; options: string[];
  correctOptions: string[]; score: number; version: number; createdAt: string;
}
export interface Answer { questionId: number; selected: string[]; }
export interface Attempt {
  id: number; userId: number; testId: number; answers: Answer[];
  seed: number; expiresAt: string; startedAt: string; completedAt?: string;
  score?: number; maxScore: number; status: 'active' | 'completed' | 'expired';
}
export interface AttemptResult {
  attemptId: number; userId: number; testId: number; score: number;
  maxScore: number; completedAt: string; answers: Answer[];
}
export interface Test { id: number; lessonId: number; title: string; questionIds: number[]; }
export interface SearchResult { id: number; title: string; }
