import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavBar } from '../navbar/navbar';
import { HomeTab } from '../tabs/home-tab/home-tab';
import { SimulationTab } from '../tabs/simulation-tab/simulation-tab';
import { AnalyzerTab } from '../tabs/analyzer-tab/analyzer-tab';
import { LessonsTab } from '../tabs/lessons-tab/lessons-tab';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, NavBar, HomeTab, SimulationTab, AnalyzerTab, LessonsTab],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.scss']
})
export class Homepage {
  active = 'Home';
  currentYear = new Date().getFullYear();

  setActive(tab: string) {
    this.active = tab;
  }
}
