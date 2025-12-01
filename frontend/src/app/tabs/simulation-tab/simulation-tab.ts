import { Component } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SimulationService } from '../../services/simulation.service';
import { GameSnapshot, Phase, PlayerSeat } from '../../shared/models/poker';
import { PlayingCard } from '../../ui/playing-card/playing-card';

interface ActionLogEntry {
  text: string;
  timestamp: number;
}

@Component({
  selector: 'app-simulation-tab',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, TitleCasePipe, PlayingCard],
  templateUrl: './simulation-tab.html',
  styleUrls: ['./simulation-tab.scss']
})
export class SimulationTab {
  snapshot: GameSnapshot | null = null;
  busy = false;
  raiseTo = 4;
  botCount = 1;
  readonly maxBots = 3;
  readonly phaseFlow: Phase[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  actionLog: ActionLogEntry[] = [];
  showRaise = false;
  handLogCollapsed = false;

  private lastActionSeen: string | null = null;
  private lastPhaseSeen: Phase | null = null;

  constructor(private readonly sim: SimulationService) {}

  newGame() {
    if (this.busy) return;
    this.busy = true;
    const seats = Math.min(this.maxBots + 1, Math.max(2, this.botCount + 1));
    this.sim.createTable(seats, 100).subscribe({
      next: snap => {
        this.processSnapshot(snap, true);
        this.busy = false;
      },
      error: err => {
        console.error('Failed to create table', err);
        this.busy = false;
      }
    });
  }

  get canAct(): boolean {
    return !!this.snapshot && this.snapshot.phase !== 'showdown' && this.snapshot.toAct === 0;
  }

  get bots(): PlayerSeat[] {
    return this.snapshot?.players?.slice(1, 4) ?? [];
  }

  get botSlots(): (PlayerSeat | null)[] {
    const slots: (PlayerSeat | null)[] = [null, null, null];
    this.bots.forEach((b, idx) => {
      if (idx < slots.length) slots[idx] = b;
    });
    return slots;
  }

  get player(): PlayerSeat | null {
    return this.snapshot?.players?.[0] ?? null;
  }

  isTurn(idx: number): boolean {
    return !!this.snapshot && this.snapshot.toAct === idx && this.snapshot.phase !== 'showdown';
  }

  botLabel(slotIndex: number, player: PlayerSeat | null): string {
    if (player?.name) return player.name;
    return `Bot ${slotIndex + 1}`;
  }

  botTurn(slotIndex: number): boolean {
    return this.isTurn(slotIndex + 1);
  }

  get callLabel(): string {
    if (!this.snapshot) {
      return 'Check';
    }
    const amount = this.snapshot.callAmount ?? 0;
    return amount > 0 ? `Call ${amount}` : 'Check';
  }

  get raiseLabel(): string {
    const s = this.snapshot;
    if (!s || !s.availableActions?.includes('raise')) return 'Raise';
    if ((s.callAmount ?? 0) === 0) return 'Bet';
    return s.lastAction?.toLowerCase().includes('raise') ? 'Re-raise' : 'Raise';
  }

  get raisePanelTitle(): string {
    const s = this.snapshot;
    if (!s || !s.availableActions?.includes('raise')) return 'Raise to';
    return (s.callAmount ?? 0) === 0 ? 'Bet amount' : 'Raise to';
  }

  get playerMaxRaise(): number {
    const player = this.player;
    if (!player) return this.snapshot?.minRaiseTo ?? 0;
    return Math.max((player.stack ?? 0) + (player.bet ?? 0), this.snapshot?.minRaiseTo ?? 0);
  }

  onRaiseChange(value: string | number) {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric) || !this.snapshot) {
      return;
    }
    this.raiseTo = this.clampRaise(Math.floor(numeric));
  }

  setQuickRaise(target: 'min' | 'pot' | 'all-in') {
    if (!this.snapshot) return;
    const min = this.snapshot.minRaiseTo ?? this.raiseTo;
    const playerCeiling = this.playerMaxRaise;
    let amount = min;

    if (target === 'pot') {
      const potBased = this.snapshot.pot + (this.snapshot.callAmount ?? 0);
      amount = Math.max(min, Math.min(potBased, playerCeiling));
    } else if (target === 'all-in') {
      amount = playerCeiling;
    }

    this.raiseTo = this.clampRaise(amount);
  }

  private clampRaise(amount: number): number {
    const min = this.snapshot?.minRaiseTo ?? 0;
    const max = this.playerMaxRaise;
    if (!Number.isFinite(amount)) return min;
    return Math.min(Math.max(amount, min), max);
  }

  trackLogEntry(_index: number, entry: ActionLogEntry) {
    return entry.timestamp;
  }

  toggleHandLog() {
    this.handLogCollapsed = !this.handLogCollapsed;
  }

  private doAct(action: 'fold'|'check'|'call'|'raise', amount?: number) {
    if (!this.snapshot || this.busy) return;
    this.busy = true;
    this.sim.act(this.snapshot.id, action, amount).subscribe({
      next: snap => {
        this.processSnapshot(snap);
        this.busy = false;
      },
      error: err => {
        console.error('Failed to act', err);
        this.busy = false;
      }
    });
  }

  fold() { this.doAct('fold'); }
  checkOrCall() {
    if (!this.snapshot) return;
    const wantsCall = (this.snapshot.callAmount ?? 0) > 0;
    this.doAct(wantsCall ? 'call' : 'check');
  }
  raise() { this.doAct('raise', this.raiseTo); }

  changeBotCount(delta: number) {
    const next = Math.min(this.maxBots, Math.max(1, this.botCount + delta));
    this.botCount = next;
  }

  enterRaise() {
    if (!this.snapshot || !this.snapshot.availableActions?.includes('raise')) return;
    this.showRaise = true;
  }

  cancelRaise() {
    this.showRaise = false;
  }

  private processSnapshot(snap: GameSnapshot, resetLog = false) {
    this.snapshot = snap;
    this.raiseTo = snap.minRaiseTo ?? this.raiseTo;
    this.updateActionLog(snap, resetLog);
    // whenever we receive a fresh snapshot, collapse the raise panel
    this.showRaise = false;
  }

  private updateActionLog(snap: GameSnapshot, resetLog = false) {
    if (resetLog) {
      this.actionLog = [];
      this.lastActionSeen = null;
      this.lastPhaseSeen = null;
      this.pushLogEntry('New hand started');
    }

    if (this.lastPhaseSeen !== snap.phase) {
      this.lastPhaseSeen = snap.phase;
      this.pushLogEntry(`${this.formatPhaseLabel(snap.phase)} phase`);
    }

    if (snap.lastAction && snap.lastAction !== this.lastActionSeen) {
      this.lastActionSeen = snap.lastAction;
      this.pushLogEntry(snap.lastAction);
    }

    if (snap.phase === 'showdown' && snap.result) {
      const playerId = snap.players[0]?.id;
      const botId = snap.players[1]?.id;
      let summary = 'Hand complete';

      if (snap.result.winner === 'split') {
        summary = 'Pot split';
      } else if (snap.result.winner === playerId) {
        summary = 'Player wins the pot';
      } else if (snap.result.winner === botId) {
        summary = 'Bot wins the pot';
      }

      this.pushLogEntry(summary);
    }
  }

  private pushLogEntry(text: string) {
    const entry: ActionLogEntry = { text, timestamp: Date.now() };
    this.actionLog = [entry, ...this.actionLog].slice(0, 12);
  }

  private formatPhaseLabel(phase: Phase) {
    return phase.charAt(0).toUpperCase() + phase.slice(1);
  }

  seatLabel(playerId: string | null): string {
    if (!playerId || !this.snapshot?.players) return '';
    const p = this.snapshot.players.find(pl => pl.id === playerId);
    return p?.name ?? '';
  }

  winnerLabel(playerId: string): string {
    const result = this.snapshot?.result;
    if (!result) return '';
    if (result.winner === 'split') return 'Split Pot';
    return result.winner === playerId ? 'Winner' : 'Runner-up';
  }
}
