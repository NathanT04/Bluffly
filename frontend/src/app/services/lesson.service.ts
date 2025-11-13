import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type LessonDifficulty = 'easy' | 'medium' | 'hard';

export interface LessonQuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswerIndex?: number;
  explanation?: string;
}

export interface LessonQuizResponse {
  difficulty: LessonDifficulty;
  limit: number;
  count: number;
  questions: LessonQuizQuestion[];
}

export interface LessonQuizResult {
  id?: string;
  difficulty: LessonDifficulty;
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
  difficulty: LessonDifficulty;
  correct: number;
  total: number;
  percentage: number;
  metadata?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class LessonService {
  constructor(private readonly http: HttpClient) {}

  getQuiz(difficulty: LessonDifficulty, limit = 10): Observable<LessonQuizResponse> {
    const params = new HttpParams()
      .set('difficulty', difficulty)
      .set('limit', limit.toString());

    return this.http.get<LessonQuizResponse>('/api/lessons/quiz', { params });
  }

  submitQuizResult(payload: LessonQuizResultPayload): Observable<LessonQuizResult> {
    return this.http.post<LessonQuizResult>('/api/lessons/results', payload);
  }

  getRecentResults(difficulty?: LessonDifficulty, limit = 10): Observable<LessonQuizResultListResponse> {
    let params = new HttpParams().set('limit', limit.toString());
    if (difficulty) {
      params = params.set('difficulty', difficulty);
    }
    return this.http.get<LessonQuizResultListResponse>('/api/lessons/results', { params });
  }
}
