import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hand-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hand-input.html',
  styleUrls: ['./hand-input.scss']
})
export class HandInput {
  @Input() cardOptions: string[][] = [];
  @Input() selectedCards: string[] = ['', ''];
  @Output() selectedCardsChange = new EventEmitter<{ index: number; value: string }>();

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
