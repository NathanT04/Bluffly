import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-playing-card',
  standalone: true,
  templateUrl: './playing-card.html',
  styleUrls: ['./playing-card.scss']
})
export class PlayingCard {
  @Input() card: string | null = null; // e.g. 'As', 'Td'

  get rank(): string {
    return this.card?.[0]?.toUpperCase() ?? '';
  }

  get suit(): 's' | 'h' | 'd' | 'c' | '' {
    const s = (this.card?.[1] ?? '').toLowerCase();
    return (['s', 'h', 'd', 'c'] as const).includes(s as any) ? (s as any) : '';
  }

  get symbol(): string {
    switch (this.suit) {
      case 's':
        return '♠';
      case 'h':
        return '♥';
      case 'd':
        return '♦';
      case 'c':
        return '♣';
      default:
        return '';
    }
  }

  get isRed(): boolean {
    return this.suit === 'h' || this.suit === 'd';
  }
}

