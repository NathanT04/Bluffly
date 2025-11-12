import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GameSnapshot } from '../shared/models/poker';

@Injectable({ providedIn: 'root' })
export class SimulationService {
  constructor(private readonly http: HttpClient) {}

  createTable(players = 2, startingStack = 100): Observable<GameSnapshot> {
    return this.http.post<GameSnapshot>('/api/table', { players, startingStack });
  }

  getTable(id: string): Observable<GameSnapshot> {
    return this.http.get<GameSnapshot>(`/api/table/${id}`);
  }

  act(id: string, action: 'fold'|'check'|'call'|'raise', amount?: number): Observable<GameSnapshot> {
    return this.http.post<GameSnapshot>(`/api/table/${id}/action`, { action, amount });
  }
}
