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

@Injectable({ providedIn: 'root' })
export class LessonService {
  constructor(private readonly http: HttpClient) {}

  getQuiz(difficulty: LessonDifficultySlug, limit = 10): Observable<LessonQuizResponse> {
    const params = new HttpParams()
      .set('difficulty', difficulty)
      .set('limit', limit.toString());

    return this.http.get<LessonQuizResponse>('/api/lessons/quiz', { params });
  }
}

