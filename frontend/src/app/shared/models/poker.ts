export type Card = string; // e.g. 'As', 'Td'

export type Phase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface PlayerSeat {
  id: string;
  name: string;
  stack: number;
  bet: number;
  folded: boolean;
  hand: Card[]; // length 2
}

export interface GameSnapshot {
  id: string;
  phase: Phase;
  dealer: number;
  toAct: number;
  pot: number;
  board: Card[]; // 0..5
  players: PlayerSeat[];
  availableActions: string[];
}

