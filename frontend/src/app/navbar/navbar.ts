import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavBar {
  @Input() active!: string;
  @Input() isAuthenticated = false;
  @Output() changeTab = new EventEmitter<string>();

  tabs = ['Home', 'Simulation', 'Analyzer', 'Lessons'];

  get visibleTabs() {
    return this.isAuthenticated ? this.tabs : ['Home'];
  }

  select(tab: string) {
    this.changeTab.emit(tab);
  }
}
