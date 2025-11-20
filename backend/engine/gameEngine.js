const { randomUUID } = require('crypto');
const { createDeck, shuffle, draw } = require('./deck');

const PHASES = ['preflop', 'flop', 'turn', 'river', 'showdown'];
const SMALL_BLIND = 1;
const BIG_BLIND = 2;

function createPlayer(id, name, stack) {
  return { id, name, stack, hand: [], folded: false, bet: 0, allIn: false };
}

function post(state, player, amount) {
  const toPost = Math.min(amount, player.stack);
  player.stack -= toPost;
  player.bet += toPost;
  state.pot += toPost;
  if (toPost < amount) player.allIn = true;
}

function nextActiveIndex(state, startIdx) {
  const total = state.players.length;
  for (let i = 1; i <= total; i++) {
    const idx = (startIdx + i) % total;
    const p = state.players[idx];
    if (!p.folded && !p.allIn) return idx;
  }
  return -1;
}

function livingPlayers(state) {
  return state.players.filter(p => !p.folded);
}

function createGame({ players = 2, startingStack = 100 } = {}) {
  const id = randomUUID();
  const deck = shuffle(createDeck());

  const totalSeats = Math.max(2, Math.min(4, players));
  const playerList = Array.from({ length: totalSeats }).map((_, i) =>
    createPlayer(`${i + 1}`, i === 0 ? 'Player' : `Bot ${i}`, startingStack)
  );

  for (let i = 0; i < 2; i++) {
    for (const p of playerList) {
      p.hand.push(...draw(deck, 1));
    }
  }

  const state = {
    id,
    phase: 'preflop',
    dealer: 0,
    toAct: 0,
    pot: 0,
    board: [],
    players: playerList,
    _deck: deck,
    currentBet: 0,
    lastRaiseSize: BIG_BLIND,
    lastActionType: null,
    awaitingResponse: false,
    roundFirst: 0,
    lastAggressor: null,
    log: []
  };

  const sbIdx = totalSeats === 2 ? state.dealer : (state.dealer + 1) % totalSeats;
  const bbIdx = totalSeats === 2 ? (state.dealer + 1) % totalSeats : (state.dealer + 2) % totalSeats;
  post(state, state.players[sbIdx], SMALL_BLIND);
  post(state, state.players[bbIdx], BIG_BLIND);
  state.currentBet = BIG_BLIND;
  state.lastRaiseSize = BIG_BLIND;
  state.lastActionType = 'blinds';
  state.lastAggressor = bbIdx;
  state.roundFirst = nextActiveIndex(state, bbIdx);
  state.toAct = state.roundFirst;
  state.awaitingResponse = true;

  return state;
}

function dealNextStreet(state) {
  for (const p of state.players) p.bet = 0;
  state.currentBet = 0;
  state.lastRaiseSize = BIG_BLIND;
  state.awaitingResponse = false;
  state.lastActionType = null;
  state.lastAggressor = null;

  if (state.phase === 'preflop') {
    state.board.push(...draw(state._deck, 3));
    state.phase = 'flop';
  } else if (state.phase === 'flop') {
    state.board.push(...draw(state._deck, 1));
    state.phase = 'turn';
  } else if (state.phase === 'turn') {
    state.board.push(...draw(state._deck, 1));
    state.phase = 'river';
  } else if (state.phase === 'river') {
    state.phase = 'showdown';
    evaluateShowdown(state);
  }

  if (state.phase !== 'showdown') {
    const start = (state.dealer + 1) % state.players.length;
    state.roundFirst = nextActiveIndex(state, start - 1 < 0 ? state.players.length - 1 : start - 1);
    state.toAct = state.roundFirst;
  }
}

function getAvailableActions(state, idx) {
  const p = state.players[idx];
  if (state.phase === 'showdown' || p.folded || p.allIn) return [];

  const callAmount = Math.max(0, state.currentBet - p.bet);
  const actions = [];
  if (callAmount > 0) actions.push('fold');
  if (callAmount === 0) actions.push('check');
  if (callAmount > 0 && p.stack > 0) actions.push('call');

  const othersCanAct = state.players.some((pl, i) => i !== idx && !pl.folded && !pl.allIn);
  const canRaise = p.stack > callAmount && othersCanAct;
  if (canRaise) actions.push('raise');
  return actions;
}

function minRaiseTo(state) {
  // if no bet yet, min open is BIG_BLIND
  if (state.currentBet === 0) return BIG_BLIND;
  return state.currentBet + state.lastRaiseSize;
}

function noOneCanAct(state) {
  return state.players.every((_, idx) => getAvailableActions(state, idx).length === 0);
}

function autoAdvanceIfLocked(state) {
  // If betting is closed (everyone all-in or no actions available), reveal remaining streets
  // until showdown.
  while (state.phase !== 'showdown' && noOneCanAct(state)) {
    dealNextStreet(state);
  }
  if (state.phase === 'showdown') {
    state.toAct = -1;
  } else {
    state.toAct = state.roundFirst;
  }
}

function applyAction(state, idx, action, amount) {
  if (state.phase === 'showdown') return;
  const p = state.players[idx];
  const callAmount = Math.max(0, state.currentBet - p.bet);

  const remaining = () => livingPlayers(state).filter(pl => !pl.folded);
  const awardIfOnlyOne = () => {
    const alive = remaining();
    if (alive.length === 1) {
      const winner = alive[0];
      winner.stack += state.pot;
      const totalPot = state.pot;
      state.result = {
        winner: winner.id,
        reason: 'fold',
        payouts: Object.fromEntries(state.players.map(pl => [pl.id, pl.id === winner.id ? totalPot : 0])),
        hero: { handName: handNameOf(state, 0) },
        villain: { handName: '' }
      };
      state.pot = 0;
      state.phase = 'showdown';
      state.toAct = -1;
      return true;
    }
    return false;
  };

  switch (action) {
    case 'fold': {
      p.folded = true;
      state.log.push(`${p.name} folds`);
      if (awardIfOnlyOne()) return;
      state.lastActionType = 'fold';
      state.toAct = nextActiveIndex(state, idx);
      return;
    }
    case 'check': {
      if (callAmount !== 0) return;
      state.log.push(`${p.name} checks`);
      const next = nextActiveIndex(state, idx);
      state.lastActionType = 'check';
      const allMatched = state.players.every(pl => pl.folded || pl.allIn || pl.bet === state.currentBet);
      if (
        next === -1 ||
        (state.lastAggressor === null && next === state.roundFirst) ||
        (state.lastAggressor !== null && allMatched && next === state.lastAggressor)
      ) {
        dealNextStreet(state);
      } else {
        state.toAct = next;
      }
      return;
    }
    case 'call': {
      const toPay = Math.min(callAmount, p.stack);
      if (toPay <= 0) return;
      p.stack -= toPay;
      p.bet += toPay;
      state.pot += toPay;
      if (p.stack === 0) p.allIn = true;
      state.log.push(`${p.name} calls ${toPay}`);
      state.awaitingResponse = false;
      state.lastActionType = 'call';
      const next = nextActiveIndex(state, idx);
      const matched = state.players.every(pl => pl.folded || pl.allIn || pl.bet === state.currentBet);
      if ((next === -1 && matched) || (state.lastAggressor !== null && matched && next === state.lastAggressor)) {
        dealNextStreet(state);
        if (state.phase !== 'showdown') state.toAct = state.roundFirst;
      } else {
        state.toAct = next === -1 ? state.lastAggressor ?? 0 : next;
      }
      autoAdvanceIfLocked(state);
      return;
    }
    case 'raise': {
      const minTo = minRaiseTo(state);
      let raiseTo = Number(amount);
      if (!Number.isFinite(raiseTo)) return;
      raiseTo = Math.max(minTo, raiseTo);
      const maxTo = p.bet + p.stack;
      raiseTo = Math.min(raiseTo, maxTo);
      const add = raiseTo - p.bet;
      if (add <= 0) return;

      const previousBet = state.currentBet;
      p.stack -= add;
      p.bet = raiseTo;
      state.pot += add;
      if (p.stack === 0) p.allIn = true;

      state.lastRaiseSize = Math.max(raiseTo - previousBet, BIG_BLIND);
      state.currentBet = raiseTo;
      state.awaitingResponse = true;
      state.lastActionType = 'raise';
      state.lastAggressor = idx;
      state.log.push(
        state.currentBet === add && previousBet === 0
          ? `${p.name} bets ${add}`
          : `${p.name} raises to ${raiseTo}`
      );
      const next = nextActiveIndex(state, idx);
      state.toAct = next === -1 ? idx : next;
      autoAdvanceIfLocked(state);
      return;
    }
    default:
      return;
  }
}

function runVillainAuto(state) {
  while (state.phase !== 'showdown' && state.toAct > 0) {
    const idx = state.toAct;
    const actions = getAvailableActions(state, idx);
    if (actions.length === 0) {
      state.toAct = nextActiveIndex(state, idx);
      if (state.toAct === 0 || state.toAct === -1) break;
      continue;
    }

    const rand = Math.random();
    let act = actions[0];
    let amt = undefined;
    const callAmt = Math.max(0, state.currentBet - state.players[idx].bet);
    if (actions.includes('fold') && callAmt > 0 && rand < 0.08) {
      act = 'fold';
    } else if (actions.includes('raise') && rand < 0.25) {
      act = 'raise';
      const minTo = minRaiseTo(state);
      amt = Math.min(minTo + BIG_BLIND, state.players[idx].bet + state.players[idx].stack);
    } else if (actions.includes('call') && callAmt > 0) {
      act = 'call';
    } else if (actions.includes('check')) {
      act = 'check';
    } else if (actions.includes('fold')) {
      act = 'fold';
    }

    applyAction(state, idx, act, amt);
    if (state.phase === 'showdown') break;
    if (state.toAct === 0 || state.toAct === -1) break;
  }
}

function toSnapshot(state) {
  const hideCards = state.phase !== 'showdown';
  return {
    id: state.id,
    phase: state.phase,
    dealer: state.dealer,
    toAct: state.toAct,
    pot: state.pot,
    currentBet: state.currentBet,
    board: [...state.board],
    players: state.players.map((p, i) => ({
      id: p.id,
      name: p.name === 'Hero' ? 'Player' : p.name,
      stack: p.stack,
      bet: p.bet,
      folded: p.folded,
      hand: i > 0 && hideCards ? [null, null] : [...p.hand]
    })),
    lastAction: state.log[state.log.length - 1] || null,
    availableActions: getAvailableActions(state, 0),
    minRaiseTo: minRaiseTo(state),
    callAmount: Math.max(0, state.currentBet - state.players[0].bet),
    result: state.result || null
  };
}

// ===== Hand evaluation =====
const RANK_MAP = { A: 14, K: 13, Q: 12, J: 11, T: 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
const REV_RANK = Object.fromEntries(Object.entries(RANK_MAP).map(([k, v]) => [v, k]));

function cardsToValues(cards) {
  return cards.map(c => ({ r: RANK_MAP[c[0]], s: c[1] }));
}

function findStraightTop(ranks) {
  // ranks: Set of numbers
  const list = Array.from(ranks).sort((a, b) => b - a);
  // wheel: treat Ace as 1
  if (ranks.has(14)) list.push(1);
  let run = 1;
  for (let i = 0; i < list.length - 1; i++) {
    if (list[i] - 1 === list[i + 1]) {
      run++;
      if (run >= 5) return list[i + 1] + 4; // top of the 5-long run
    } else if (list[i] !== list[i + 1]) {
      run = 1;
    }
  }
  return 0;
}

function evaluate7(cards) {
  // cards: array of 7 like 'As', 'Td'
  const vals = cardsToValues(cards);
  const bySuit = { s: [], h: [], d: [], c: [] };
  const countByRank = new Map();
  for (const c of vals) {
    bySuit[c.s].push(c.r);
    countByRank.set(c.r, (countByRank.get(c.r) || 0) + 1);
  }

  // Straight Flush
  for (const suit of ['s', 'h', 'd', 'c']) {
    if (bySuit[suit].length >= 5) {
      const ranks = new Set(bySuit[suit]);
      const top = findStraightTop(ranks);
      if (top) {
        const name = top === 14 ? 'Royal Flush' : `Straight Flush`;
        return { cat: 9, t: [top], name };
      }
    }
  }

  // Groups
  const groups = Array.from(countByRank.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  // Four of a kind
  if (groups[0] && groups[0][1] === 4) {
    const quad = groups[0][0];
    const kicker = groups.find(g => g[0] !== quad)[0];
    return { cat: 8, t: [quad, kicker], name: `Four of a Kind (${REV_RANK[quad]})` };
  }

  // Full House
  const trips = groups.filter(g => g[1] === 3).map(g => g[0]).sort((a, b) => b - a);
  const pairs = groups.filter(g => g[1] === 2).map(g => g[0]).sort((a, b) => b - a);
  if (trips.length >= 1 && (pairs.length >= 1 || trips.length >= 2)) {
    const tRank = trips[0];
    const pRank = pairs.length >= 1 ? pairs[0] : trips[1];
    return { cat: 7, t: [tRank, pRank], name: `Full House (${REV_RANK[tRank]} over ${REV_RANK[pRank]})` };
  }

  // Flush
  for (const suit of ['s', 'h', 'd', 'c']) {
    if (bySuit[suit].length >= 5) {
      const top5 = bySuit[suit].sort((a, b) => b - a).slice(0, 5);
      return { cat: 6, t: top5, name: 'Flush' };
    }
  }

  // Straight
  const topStraight = findStraightTop(new Set(vals.map(v => v.r)));
  if (topStraight) {
    return { cat: 5, t: [topStraight], name: 'Straight' };
  }

  // Trips
  if (trips.length >= 1) {
    const tRank = trips[0];
    const kickers = groups.filter(g => g[0] !== tRank).map(g => g[0]).sort((a, b) => b - a).slice(0, 2);
    return { cat: 4, t: [tRank, ...kickers], name: `Three of a Kind (${REV_RANK[tRank]})` };
  }

  // Two pair
  if (pairs.length >= 2) {
    const [p1, p2] = pairs.slice(0, 2);
    const kicker = groups.find(g => g[0] !== p1 && g[0] !== p2)[0];
    return { cat: 3, t: [p1, p2, kicker], name: `Two Pair (${REV_RANK[p1]} and ${REV_RANK[p2]})` };
  }

  // One pair
  if (pairs.length === 1) {
    const pRank = pairs[0];
    const kickers = groups.filter(g => g[0] !== pRank).map(g => g[0]).sort((a, b) => b - a).slice(0, 3);
    return { cat: 2, t: [pRank, ...kickers], name: `Pair of ${REV_RANK[pRank]}s` };
  }

  // High card
  const high = groups.map(g => g[0]).sort((a, b) => b - a).slice(0, 5);
  return { cat: 1, t: high, name: `High Card ${REV_RANK[high[0]]}` };
}

function compareEval(a, b) {
  if (a.cat !== b.cat) return a.cat - b.cat;
  const len = Math.max(a.t.length, b.t.length);
  for (let i = 0; i < len; i++) {
    const x = a.t[i] || 0;
    const y = b.t[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}

function handNameOf(state, idx) {
  const cards = [...state.players[idx].hand, ...state.board];
  if (cards.length < 7 || cards.some(c => !c)) return '';
  return evaluate7(cards).name;
}

function evaluateShowdown(state) {
  const livePlayers = state.players.filter(p => !p.folded);
  if (livePlayers.some(p => p.hand.some(c => !c))) return;

  const evals = livePlayers.map(p => ({
    player: p,
    eval: evaluate7([...p.hand, ...state.board])
  }));

  evals.sort((a, b) => compareEval(a.eval, b.eval)).reverse();
  const best = evals[0];
  const winners = evals.filter(e => compareEval(e.eval, best.eval) === 0).map(e => e.player);
  const share = Math.floor(state.pot / winners.length);
  const payouts = {};
  for (const pl of state.players) payouts[pl.id] = 0;
  for (const w of winners) {
    payouts[w.id] = share;
    w.stack += share;
  }
  // odd chips left to first winner
  const remainder = state.pot - share * winners.length;
  if (remainder > 0) {
    payouts[winners[0].id] += remainder;
    winners[0].stack += remainder;
  }

  const handDetails = state.players.map(pl => ({
    id: pl.id,
    name: pl.name === 'Hero' ? 'Player' : pl.name,
    handName: pl.folded ? 'Folded' : evaluate7([...pl.hand, ...state.board]).name
  }));

  state.result = {
    winner: winners.length === 1 ? winners[0].id : 'split',
    reason: 'showdown',
    payouts,
    hero: { handName: handNameOf(state, 0) },
    villain: { handName: '' },
    hands: handDetails
  };
  state.pot = 0;
  state.toAct = -1;
}

module.exports = {
  createGame,
  dealNextStreet,
  toSnapshot,
  applyAction,
  runVillainAuto,
  PHASES,
  SMALL_BLIND,
  BIG_BLIND
};
