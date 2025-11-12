export type Card = string | null; // e.g. 'As', 'Td' or null when hidden

export type Phase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface PlayerSeat {
  id: string;
  name: string;
  stack: number;
  bet: number;
  folded: boolean;
  hand: Card[]; // length 2
}

export interface GameResult {
  winner: string | 'split';
  reason: 'fold' | 'showdown';
  payouts: Record<string, number>;
  hero: { handName: string };
  villain: { handName: string };
}

export interface GameSnapshot {
  id: string;
  phase: Phase;
  dealer: number;
  toAct: number;
  pot: number;
  currentBet: number;
  board: Card[]; // 0..5
  players: PlayerSeat[];
  availableActions: ('fold'|'check'|'call'|'raise')[];
  minRaiseTo: number;
  callAmount: number;
  lastAction: string | null;
  result: GameResult | null;
}
