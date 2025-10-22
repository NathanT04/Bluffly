import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandInput } from './hand-input/hand-input';
import { BoardInput } from './board-input/board-input';
import { AnalysisResults } from './analysis-results/analysis-results';

@Component({
  selector: 'app-analyzer-tab',
  standalone: true,
  imports: [CommonModule, HandInput, BoardInput, AnalysisResults],
  templateUrl: './analyzer-tab.html',
  styleUrls: ['./analyzer-tab.scss']
})
export class AnalyzerTab implements OnInit {
  private readonly ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  private readonly suits = ['s', 'h', 'd', 'c'];

  readonly allCards = this.ranks.flatMap(rank => this.suits.map(suit => `${rank}${suit}`));

  holeCards: string[] = ['', ''];
  boardCards: string[] = ['', '', '', '', ''];
  handOptions: string[][] = [];
  boardOptions: string[][] = [];

  equity: string | null = null;
  potOdds: string | null = null;
  resultMessage = '';
  hasSubmission = false;

  ngOnInit(): void {
    this.updateOptions();
  }

  get isCalculateDisabled(): boolean {
    return this.holeCards.some(card => !card);
  }

  onHoleCardChange(event: { index: number; value: string }) {
    if (this.holeCards[event.index] === event.value) {
      return;
    }

    this.holeCards = this.holeCards.map((card, i) => (i === event.index ? event.value : card));
    this.removeBoardDuplicates();
    this.updateOptions();
  }

  onBoardCardChange(event: { index: number; value: string }) {
    if (this.boardCards[event.index] === event.value) {
      return;
    }

    this.boardCards = this.boardCards.map((card, i) => (i === event.index ? event.value : card));
    this.updateOptions();
  }

  calculateEquity() {
    this.hasSubmission = true;
    this.equity = null;
    this.potOdds = null;
    this.resultMessage = 'backend is mr frogged';
  }

  private isCardSelectedElsewhere(card: string, index: number, stack: string[]): boolean {
    return stack.some((value, i) => i !== index && value === card);
  }

  private removeBoardDuplicates() {
    const holeSet = new Set(this.holeCards.filter(Boolean));
    const nextBoard = this.boardCards.map(card => (holeSet.has(card) ? '' : card));

    if (nextBoard.some((card, index) => card !== this.boardCards[index])) {
      this.boardCards = nextBoard;
    }
  }

  private updateOptions() {
    this.handOptions = this.holeCards.map((_, index) =>
      this.allCards.filter(card => !this.isCardSelectedElsewhere(card, index, this.holeCards))
    );

    const holeSet = new Set(this.holeCards.filter(Boolean));
    this.boardOptions = this.boardCards.map((_, index) =>
      this.allCards.filter(card => !holeSet.has(card) && !this.isCardSelectedElsewhere(card, index, this.boardCards))
    );
  }
}
