import { Component } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { SimulationService } from '../../services/simulation.service';
import { GameSnapshot } from '../../shared/models/poker';
import { PlayingCard } from '../../ui/playing-card/playing-card';

@Component({
  selector: 'app-simulation-tab',
  standalone: true,
  imports: [CommonModule, HttpClientModule, TitleCasePipe, PlayingCard],
  templateUrl: './simulation-tab.html',
  styleUrls: ['./simulation-tab.scss']
})
export class SimulationTab {
  snapshot: GameSnapshot | null = null;
  busy = false;

  constructor(private readonly sim: SimulationService) {}

  newGame() {
    if (this.busy) return;
    this.busy = true;
    this.sim.createTable(2, 100).subscribe({
      next: snap => {
        this.snapshot = snap;
        this.busy = false;
      },
      error: err => {
        console.error('Failed to create table', err);
        this.busy = false;
      }
    });
  }

  nextStreet() {
    if (!this.snapshot || this.busy) return;
    this.busy = true;
    this.sim.next(this.snapshot.id).subscribe({
      next: snap => {
        this.snapshot = snap;
        this.busy = false;
      },
      error: err => {
        console.error('Failed to progress street', err);
        this.busy = false;
      }
    });
  }
}
