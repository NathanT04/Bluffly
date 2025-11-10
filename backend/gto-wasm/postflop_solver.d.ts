/* tslint:disable */
/* eslint-disable */
export function solverVersion(): string;
export class WasmPostflopSolver {
  free(): void;
  [Symbol.dispose](): void;
  backToRoot(): void;
  memoryUsage(): Float64Array;
  currentBoard(): string[];
  privateHands(player: number): string[];
  updateConfig(config: any): void;
  currentPlayer(): number;
  computeExploitability(): number;
  isChanceNode(): boolean;
  possibleCards(): string[];
  allocateMemory(enable_compression: boolean): void;
  expectedValues(player: number): Float32Array;
  isTerminalNode(): boolean;
  playChanceCard(card: string): void;
  availableActions(): any;
  numPrivateHands(player: number): number;
  normalizedWeights(player: number): Float32Array;
  cacheNormalizedWeights(): void;
  constructor(config: any);
  playAction(index: number): void;
  solve(max_iterations: number, target_exploitability: number): number;
  equity(player: number): Float32Array;
  strategy(): Float32Array;
}
