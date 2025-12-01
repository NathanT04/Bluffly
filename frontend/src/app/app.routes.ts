// filepath: src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeTab } from './tabs/home-tab/home-tab';
import { AnalyzerTab } from './tabs/analyzer-tab/analyzer-tab';
import { LessonsTab } from './tabs/lessons-tab/lessons-tab';
import { SimulationTab } from './tabs/simulation-tab/simulation-tab';

export const routes: Routes = [
  { path: 'home', component: HomeTab },
  { path: 'analyzer', component: AnalyzerTab },
  { path: 'quizzes', component: LessonsTab },
  { path: 'simulation', component: SimulationTab },
  { path: '', redirectTo: '/home', pathMatch: 'full' }
];
