import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HandInput } from './hand-input/hand-input';
import { BoardInput } from './board-input/board-input';
import { AnalysisResults } from './analysis-results/analysis-results';

@Component({
  selector: 'app-analyzer-tab',
  standalone: true,
  imports: [CommonModule, HttpClientModule, HandInput, BoardInput, AnalysisResults],
  templateUrl: './analyzer-tab.html',
  styleUrls: ['./analyzer-tab.scss']
})

export class AnalyzerTab implements OnInit {
  private readonly ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  private readonly suits = ['s', 'h', 'd', 'c'];
  private readonly simulationIterations = 25000;

  readonly allCards = this.ranks.flatMap(rank => this.suits.map(suit => `${rank}${suit}`));

  holeCards: string[] = ['', ''];
  boardCards: string[] = ['', '', '', '', ''];
  handOptions: string[][] = [];
  boardOptions: string[][] = [];

  equity: string | null = null;
  potOdds: string | null = null;
  resultMessage = '';
  hasSubmission = false;
  isCalculating = false;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.updateOptions();
  }

  get isCalculateDisabled(): boolean {
    return this.isCalculating || this.holeCards.some(card => !card);
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
    if (this.isCalculating) {
      return;
    }

    this.hasSubmission = true;
    this.equity = null;
    this.potOdds = null;
    this.resultMessage = 'Running equity simulation against a random opponent range...';
    this.isCalculating = true;

    const heroHand = [...this.holeCards] as [string, string];
    const board = this.boardCards.filter((card): card is string => Boolean(card));

    this.http
      .post<AnalyzerResponse>('/api/analyzer/equity', {
        hero: heroHand,
        board,
        iterations: this.simulationIterations
      })
      .subscribe({
        next: response => {
          const equityPercentage = response?.equity?.percentage ?? 0;
          this.equity = `${equityPercentage.toFixed(1)}%`;
          this.potOdds = this.formatPotOddsRatio(equityPercentage);
          this.resultMessage =
            'Pot odds show the minimum pot-to-call ratio to break even with your current equity.';
          this.isCalculating = false;
        },
        error: error => {
          console.error('Failed to calculate poker equity', error);
          const backendMessage = (error?.error && typeof error.error === 'object' && 'error' in error.error)
            ? String(error.error.error)
            : null;
          this.resultMessage =
            backendMessage ||
            'Failed to calculate equity. Please try again or check the console for more details.';
          this.isCalculating = false;
        }
      });
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

  private formatPotOddsRatio(equityPercentage: number): string {
    const equity = equityPercentage / 100;
    if (equity <= 0) {
      return '0.00 : 1';
    }
    if (equity >= 1) {
      return '∞ : 1';
    }

    const ratio = 1 / equity - 1;
    return `${ratio.toFixed(2)} : 1`;
  }
}

type AnalyzerResponse = {
  equity: {
    percentage: number;
    wins: number;
    ties: number;
    count: number;
  };
  board: string[];
  iterations: number;
};
