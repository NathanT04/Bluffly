let WasmPostflopSolver;
try {
  ({ WasmPostflopSolver } = require('../gto-wasm/postflop_solver.js'));
} catch (error) {
  console.error('Failed to load GTO WASM bindings:', error);
}

const HERO_PLAYER_INDEX = 1; // hero acts in position (IP)
const MAX_ITERATIONS = 50;
const TARGET_EXPLOITABILITY = 0.5;
const DEFAULT_VILLAIN_RANGE = '22+,A2s+,K9s+,QTs+,JTs,T9s,98s,87s,76s,AJo+,KQo';
const DEFAULT_BET_SIZES = { bet: '60%, e, a', raise: '2.5x' };
const makeTreeConfig = () => {
  const betOptions = { ...DEFAULT_BET_SIZES };
  return {
    startingPot: 200,
    effectiveStack: 900,
    rakeRate: 0,
    rakeCap: 0,
    flopBetSizes: [{ ...betOptions }, { ...betOptions }],
    turnBetSizes: [{ ...betOptions }, { ...betOptions }],
    riverBetSizes: [{ ...betOptions }, { ...betOptions }],
    turnDonkSizes: null,
    riverDonkSizes: '50%',
    addAllinThreshold: 1.5,
    forceAllinThreshold: 0.15,
    mergingThreshold: 0.1
  };
};

const rankValue = {
  '2': 0,
  '3': 1,
  '4': 2,
  '5': 3,
  '6': 4,
  '7': 5,
  '8': 6,
  '9': 7,
  T: 8,
  J: 9,
  Q: 10,
  K: 11,
  A: 12
};

const suitValue = { c: 0, d: 1, h: 2, s: 3 };

const numberFormatter = new Intl.NumberFormat('en-US');

const formatChipAmount = amount =>
  typeof amount === 'number' && Number.isFinite(amount)
    ? numberFormatter.format(amount)
    : '';

const normalizeCard = card => {
  if (typeof card !== 'string' || card.length < 2) {
    return null;
  }
  const rank = card[0]?.toUpperCase();
  const suit = card[1]?.toLowerCase();
  if (!rankValue.hasOwnProperty(rank) || !suitValue.hasOwnProperty(suit)) {
    return null;
  }
  return `${rank}${suit}`;
};

const toHoleString = cards => {
  const normalized = cards
    .map(normalizeCard)
    .filter(Boolean);
  if (normalized.length !== 2) {
    return null;
  }
  normalized.sort((a, b) => {
    const rankDiff = rankValue[b[0]] - rankValue[a[0]];
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return suitValue[b[1]] - suitValue[a[1]];
  });
  return normalized.join('');
};

const toBoardStrings = board => {
  const normalized = board
    .map(normalizeCard)
    .filter(Boolean);
  if (normalized.length < 3) {
    return null;
  }
  const flop = normalized.slice(0, 3).join('');
  const turn = normalized[3];
  const river = normalized[4];
  return { flop, turn, river };
};

const makeConfig = (heroRange, board) => {
  const boardStrings = toBoardStrings(board);
  if (!boardStrings) {
    return null;
  }
  return {
    oopRange: DEFAULT_VILLAIN_RANGE,
    ipRange: heroRange,
    flop: boardStrings.flop,
    turn: boardStrings.turn,
    river: boardStrings.river,
    tree: makeTreeConfig()
  };
};

const clampProbability = value => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
};

const formatActionLabel = action => {
  if (!action || typeof action !== 'object' || !action.kind) {
    return '—';
  }
  switch (action.kind) {
    case 'Bet':
    case 'Raise':
      return `${action.kind} ${formatChipAmount(action.amount)}`.trim();
    case 'AllIn':
      return `All-in ${formatChipAmount(action.amount)}`.trim();
    case 'Chance':
      return action.card ? `Deal ${action.card.toUpperCase()}` : 'Deal card';
    default:
      return action.kind;
  }
};

const extractRecommendation = (solver, heroKey) => {
  const heroHands = solver.privateHands(HERO_PLAYER_INDEX);
  const heroIndex = heroHands.indexOf(heroKey);
  if (heroIndex === -1) {
    return {
      status: 'error',
      message: 'Hero hand is not part of the solver range.'
    };
  }

  const strategy = solver.strategy();
  const numHands = heroHands.length;
  const actions = solver.availableActions();

  const scored = actions.map((action, idx) => {
    const probability = clampProbability(strategy[heroIndex + idx * numHands]);
    return {
      label: formatActionLabel(action),
      probability
    };
  });

  scored.sort((a, b) => b.probability - a.probability);

  return {
    status: 'ok',
    recommendation: scored[0] ?? null,
    topActions: scored.slice(0, 3)
  };
};

exports.getGtoRecommendation = (hero, board) => {
  if (!WasmPostflopSolver) {
    return {
      status: 'error',
      message: 'GTO module is unavailable on this server.'
    };
  }

  const heroKey = toHoleString(hero ?? []);
  if (!heroKey) {
    return {
      status: 'error',
      message: 'Hero hand is invalid for GTO analysis.'
    };
  }

  const config = makeConfig(heroKey, board ?? []);
  if (!config) {
    return {
      status: 'unavailable',
      message: 'Add at least a complete flop before requesting GTO advice.'
    };
  }

  try {
    const solver = new WasmPostflopSolver(config);
    solver.allocateMemory(false);
    solver.solve(MAX_ITERATIONS, TARGET_EXPLOITABILITY);
    solver.cacheNormalizedWeights();
    const summary = extractRecommendation(solver, heroKey);
    solver.free?.();
    return summary;
  } catch (error) {
    console.error('Failed to compute GTO recommendation:', error);
    return {
      status: 'error',
      message: 'Failed to compute a GTO recommendation. Please try again later.'
    };
  }
};
