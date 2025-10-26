import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-board-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './board-input.html',
  styleUrls: ['./board-input.scss']
})
export class BoardInput {
  @Input() cardOptions: string[][] = [];
  @Input() selectedCards: string[] = ['', '', '', '', ''];
  @Output() selectedCardsChange = new EventEmitter<{ index: number; value: string }>();

  readonly stageLabels = ['Flop 1', 'Flop 2', 'Flop 3', 'Turn', 'River'];

  trackByIndex(index: number): number {
    return index;
  }

  trackByOption(_index: number, option: string): string {
    return option;
  }

  onSelectChange(index: number, value: string) {
    this.selectedCardsChange.emit({ index, value });
  }
}
