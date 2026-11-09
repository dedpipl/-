import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map, switchMap } from 'rxjs';
import { Course, Lesson, Question, Attempt, AttemptResult, Answer, SearchResult } from './models';

const now = new Date().toISOString();
const initialCourses: Course[] = [
  { id: 1, title: 'Основы веб-разработки', description: 'HTML, CSS и основы TypeScript', version: 1, createdAt: now, updatedAt: now, lessonIds: [1,2,3] }
];
const initialLessons: Lesson[] = [
  { id: 1, courseId: 1, title: 'Введение в веб', order: 1, content: 'Веб-страница состоит из HTML-разметки, CSS-стилей и JavaScript-логики.', version: 1, createdAt: now, updatedAt: now, testId: 1 },
  { id: 2, courseId: 1, title: 'HTML и структура', order: 2, content: 'HTML задаёт структуру страницы с помощью тегов.', version: 1, createdAt: now, updatedAt: now, testId: 2 },
  { id: 3, courseId: 1, title: 'CSS и оформление', order: 3, content: 'CSS отвечает за внешний вид и расположение элементов.', version: 1, createdAt: now, updatedAt: now, testId: 3 }
];
const initialQuestions: Question[] = [
  { id: 1, testId: 1, text: 'Что используется для структуры веб-страницы?', options: ['HTML','CSS','SQL','Java'], correctOptions: ['HTML'], score: 2, version: 1, createdAt: now },
  { id: 2, testId: 1, text: 'Выберите языки и технологии веб-интерфейса:', options: ['HTML','CSS','TypeScript','Photoshop'], correctOptions: ['HTML','CSS','TypeScript'], score: 3, version: 1, createdAt: now },
  { id: 3, testId: 2, text: 'Какой тег задаёт основной заголовок?', options: ['<h1>','<p>','<img>'], correctOptions: ['<h1>'], score: 2, version: 1, createdAt: now },
  { id: 4, testId: 2, text: 'Какие теги обычно являются семантическими?', options: ['<header>','<main>','<div>','<footer>'], correctOptions: ['<header>','<main>','<footer>'], score: 3, version: 1, createdAt: now },
  { id: 5, testId: 3, text: 'Для чего нужен CSS?', options: ['Для оформления','Для хранения базы данных'], correctOptions: ['Для оформления'], score: 2, version: 1, createdAt: now }
];
const initialTests = [{id:1,lessonId:1,title:'Проверка: введение',questionIds:[1,2]},{id:2,lessonId:2,title:'Проверка: HTML',questionIds:[3,4]},{id:3,lessonId:3,title:'Проверка: CSS',questionIds:[5]}];

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly coursesState = signal<Course[]>(this.read('courses', initialCourses));
  private readonly lessonsState = signal<Lesson[]>(this.read('lessons', initialLessons));
  private readonly questionsState = signal<Question[]>(this.read('questions', initialQuestions));
  private readonly attemptsState = signal<Attempt[]>(this.read('attempts', []));
  private readonly resultsState = signal<AttemptResult[]>(this.read('results', []));
  readonly courses = this.coursesState.asReadonly();
  readonly lessons = this.lessonsState.asReadonly();
  readonly questions = this.questionsState.asReadonly();
  readonly attempts = this.attemptsState.asReadonly();
  readonly results = this.resultsState.asReadonly();
  readonly completedCount = computed(() => this.resultsState().length);
  readonly averageScore = computed(() => {
    const all = this.resultsState();
    return all.length ? Math.round(all.reduce((sum, r) => sum + r.score / Math.max(r.maxScore,1) * 100, 0) / all.length) : 0;
  });
  readonly questionDifficulty = computed(() => this.questionsState().map(q => {
    const completed = this.resultsState().filter(r => r.answers.some(a => a.questionId === q.id));
    const correct = completed.filter(r => {
      const answer = r.answers.find(a => a.questionId === q.id)?.selected ?? [];
      return this.sameSet(answer, q.correctOptions);
    }).length;
    return { question: q.text, correctRate: completed.length ? Math.round(correct / completed.length * 100) : 0, responses: completed.length };
  }));

  constructor(private http: HttpClient) {}

  private read<T>(key: string, fallback: T): T {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; }
    catch { return fallback; }
  }
  private save(): void {
    localStorage.setItem('courses', JSON.stringify(this.coursesState()));
    localStorage.setItem('lessons', JSON.stringify(this.lessonsState()));
    localStorage.setItem('questions', JSON.stringify(this.questionsState()));
    localStorage.setItem('attempts', JSON.stringify(this.attemptsState()));
    localStorage.setItem('results', JSON.stringify(this.resultsState()));
  }
  private sameSet(a: string[], b: string[]): boolean {
    return a.length === b.length && [...a].sort().every((v,i) => v === [...b].sort()[i]);
  }
  getTestQuestions(testId: number, seed: number): Question[] {
    const ids = initialTests.find(t => t.id === testId)?.questionIds ?? [];
    return this.questionsState().filter(q => ids.includes(q.id)).sort((a,b) => this.randomKey(a.id, seed) - this.randomKey(b.id, seed));
  }
  private randomKey(id: number, seed: number): number {
    let x = (id * 9301 + seed * 49297) % 233280; x = (x * 9301 + 49297) % 233280; return x;
  }
  getTestId(lessonId: number): number { return initialTests.find(t => t.lessonId === lessonId)?.id ?? 1; }
  getCompletedLessonIds(userId = 1): number[] {
    const completedTestIds = this.resultsState().filter(r => r.userId === userId).map(r => r.testId);
    return this.lessonsState().filter(l => completedTestIds.includes(l.testId)).map(l => l.id);
  }
  isLessonUnlocked(lesson: Lesson): boolean {
    if (lesson.order === 1) return true;
    const previous = this.lessonsState().find(l => l.courseId === lesson.courseId && l.order === lesson.order - 1);
    return !!previous && this.getCompletedLessonIds().includes(previous.id);
  }
  startOrResume(testId: number, userId = 1): Attempt {
    const existing = this.attemptsState().find(a => a.testId === testId && a.userId === userId && a.status === 'active');
    if (existing && new Date(existing.expiresAt).getTime() > Date.now()) return existing;
    if (existing) this.expire(existing.id);
    const seed = Math.floor(Math.random() * 1000000);
    const startedAt = new Date().toISOString();
    const attempt: Attempt = { id: Date.now(), userId, testId, answers: [], seed, startedAt, expiresAt: new Date(Date.now()+20*60*1000).toISOString(), maxScore: this.getTestQuestions(testId,seed).reduce((s,q)=>s+q.score,0), status:'active' };
    this.attemptsState.update(list => [...list, attempt]); this.save(); return attempt;
  }
  updateAnswer(attemptId: number, answer: Answer): void {
    this.attemptsState.update(list => list.map(a => a.id !== attemptId || a.status !== 'active' ? a : {
      ...a, answers: [...a.answers.filter(x => x.questionId !== answer.questionId), { ...answer, selected: [...answer.selected] }]
    }));
    this.save();
  }
  finish(attemptId: number): AttemptResult | null {
    const attempt = this.attemptsState().find(a => a.id === attemptId);
    if (!attempt || attempt.status !== 'active') return this.resultsState().find(r => r.attemptId === attemptId) ?? null;
    const questions = this.getTestQuestions(attempt.testId, attempt.seed);
    const score = questions.reduce((sum,q) => {
      const selected = attempt.answers.find(a => a.questionId === q.id)?.selected ?? [];
      return sum + (this.sameSet(selected, q.correctOptions) ? q.score : 0);
    },0);
    const result: AttemptResult = { attemptId, userId: attempt.userId, testId: attempt.testId, score, maxScore: attempt.maxScore, completedAt: new Date().toISOString(), answers: attempt.answers };
    this.attemptsState.update(list => list.map(a => a.id === attemptId ? {...a,status:'completed',completedAt:result.completedAt,score} : a));
    if (!this.resultsState().some(r => r.attemptId === attemptId)) this.resultsState.update(list => [...list,result]);
    this.save(); return result;
  }
  expire(attemptId: number): void {
    this.attemptsState.update(list => list.map(a => a.id === attemptId && a.status === 'active' ? {...a,status:'expired'} : a)); this.save();
  }
  searchCourses(term: string): Observable<SearchResult[]> {
    const params = new HttpParams().set('q', term);
    return this.http.get<SearchResult[]>('/api/courses/search', { params }).pipe(
      // При отсутствии backend используем локальные данные как демонстрационный ответ.
      switchMap(items => of(items)),
    );
  }
  searchLocal(term: string): Observable<Course[]> {
  const q = term.toLowerCase();

  return of(
    this.coursesState().filter(c =>
      c.title.toLowerCase().includes(q)
    )
  ).pipe(delay(100));
}
  addCourse(title: string, description: string): void {
    const id = Math.max(0,...this.coursesState().map(c=>c.id))+1;
    const date = new Date().toISOString();
    this.coursesState.update(list=>[...list,{id,title,description,version:1,createdAt:date,updatedAt:date,lessonIds:[]}]); this.save();
  }
  addLesson(courseId:number,title:string,content:string): void {
    const list=this.lessonsState().filter(l=>l.courseId===courseId);
    const id=Math.max(0,...this.lessonsState().map(l=>l.id))+1, date=new Date().toISOString();
    const lesson:Lesson={id,courseId,title,content,order:list.length+1,version:1,createdAt:date,updatedAt:date,testId:Date.now()};
    this.lessonsState.update(a=>[...a,lesson]);
    this.coursesState.update(a=>a.map(c=>c.id===courseId?{...c,lessonIds:[...c.lessonIds,id],updatedAt:date,version:c.version+1}:c)); this.save();
  }
  addQuestion(testId:number,text:string,options:string[],correctOptions:string[],score:number):void {
    const id=Math.max(0,...this.questionsState().map(q=>q.id))+1;
    this.questionsState.update(a=>[...a,{id,testId,text,options,correctOptions,score,version:1,createdAt:new Date().toISOString()}]); this.save();
  }
}