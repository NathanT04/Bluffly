import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type LessonDifficultySlug = 'easy' | 'medium' | 'hard';

export interface LessonQuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswerIndex?: number;
  explanation?: string;
}

export interface LessonQuizResponse {
  slug: LessonDifficultySlug;
  difficulty: string;
  limit: number;
  count: number;
  questions: LessonQuizQuestion[];
}

export interface LessonQuizResult {
  id?: string;
  slug: LessonDifficultySlug;
  difficulty: string;
  correct: number;
  total: number;
  percentage: number;
  submittedAt: string;
}

export interface LessonQuizResultListResponse {
  count: number;
  results: LessonQuizResult[];
}

export interface LessonQuizResultPayload {
  slug: LessonDifficultySlug;
  difficulty: string;
  correct: number;
  total: number;
  percentage: number;
  metadata?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class LessonService {
  constructor(private readonly http: HttpClient) {}

  getQuiz(difficulty: LessonDifficultySlug, limit = 10): Observable<LessonQuizResponse> {
    const params = new HttpParams()
      .set('difficulty', difficulty)
      .set('limit', limit.toString());

    return this.http.get<LessonQuizResponse>('/api/lessons/quiz', { params });
  }

  submitQuizResult(payload: LessonQuizResultPayload): Observable<LessonQuizResult> {
    return this.http.post<LessonQuizResult>('/api/lessons/results', payload);
  }

  getRecentResults(slug?: LessonDifficultySlug, limit = 10): Observable<LessonQuizResultListResponse> {
    let params = new HttpParams().set('limit', limit.toString());
    if (slug) {
      params = params.set('slug', slug);
    }
    return this.http.get<LessonQuizResultListResponse>('/api/lessons/results', { params });
  }
}
