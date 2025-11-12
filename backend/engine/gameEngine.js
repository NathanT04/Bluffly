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

function createGame({ players = 2, startingStack = 100 } = {}) {
  const id = randomUUID();
  const deck = shuffle(createDeck());

  const playerList = Array.from({ length: Math.max(2, Math.min(2, players)) }).map((_, i) =>
    createPlayer(`${i + 1}`, i === 0 ? 'Player' : 'Bot', startingStack)
  );

  // deal 2 to each
  for (let i = 0; i < 2; i++) {
    for (const p of playerList) {
      p.hand.push(...draw(deck, 1));
    }
  }

  // initialize state + blinds (heads-up; dealer is SB)
  const state = {
    id,
    phase: 'preflop',
    dealer: 0, // hero as dealer/SB
    toAct: 0, // SB acts first preflop
    pot: 0,
    board: [],
    players: playerList,
    _deck: deck,
    currentBet: 0,
    lastRaiseSize: BIG_BLIND,
    lastActionType: null,
    awaitingResponse: false,
    log: []
  };

  // Post blinds
  post(state, state.players[0], SMALL_BLIND);
  post(state, state.players[1], BIG_BLIND);
  state.currentBet = BIG_BLIND;
  state.lastRaiseSize = BIG_BLIND;
  state.toAct = 0; // SB acts first preflop
  state.lastActionType = 'blinds';
  state.awaitingResponse = true; // BB posted, awaiting SB action

  return state;
}

function dealNextStreet(state) {
  // reset street bets and flags
  for (const p of state.players) p.bet = 0;
  state.currentBet = 0;
  state.lastRaiseSize = BIG_BLIND;
  state.awaitingResponse = false;
  state.lastActionType = null;

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

  // post-flop, the player after dealer acts first
  if (state.phase !== 'showdown') {
    state.toAct = (state.dealer + 1) % 2;
  }
}

function other(idx) {
  return idx === 0 ? 1 : 0;
}

function getAvailableActions(state, idx) {
  const p = state.players[idx];
  if (state.phase === 'showdown' || p.folded || p.allIn) return [];

  const callAmount = Math.max(0, state.currentBet - p.bet);
  const actions = [];
  // Fold allowed if there is a bet to you; you could permit always but keep it standard
  if (callAmount > 0) actions.push('fold');
  if (callAmount === 0) actions.push('check');
  if (callAmount > 0 && p.stack > 0) actions.push('call');

  // Raise (or bet if currentBet==0)
  const canRaise = p.stack > callAmount && !state.players[other(idx)].allIn;
  if (canRaise) actions.push('raise');
  return actions;
}

function minRaiseTo(state) {
  // if no bet yet, min open is BIG_BLIND
  if (state.currentBet === 0) return BIG_BLIND;
  return state.currentBet + state.lastRaiseSize;
}

function noOneCanAct(state) {
  // True if neither seat has any legal action this street (e.g., both all-in or folded)
  const a0 = getAvailableActions(state, 0);
  const a1 = getAvailableActions(state, 1);
  return a0.length === 0 && a1.length === 0;
}

function autoAdvanceIfLocked(state) {
  // If betting is closed (everyone all-in or no actions available), reveal remaining streets
  // until showdown.
  while (state.phase !== 'showdown' && noOneCanAct(state)) {
    dealNextStreet(state);
  }
  if (state.phase === 'showdown') {
    state.toAct = -1;
  }
}

function applyAction(state, idx, action, amount) {
  if (state.phase === 'showdown') return;
  const p = state.players[idx];
  const opp = state.players[other(idx)];
  const callAmount = Math.max(0, state.currentBet - p.bet);

  switch (action) {
    case 'fold': {
      p.folded = true;
      state.log.push(`${p.name} folds`);
      // award pot to opponent
      const won = state.pot;
      opp.stack += won;
      state.pot = 0;
      state.phase = 'showdown';
      state.toAct = -1;
      state.awaitingResponse = false;
      state.lastActionType = 'fold';
      state.result = {
        winner: opp.id,
        reason: 'fold',
        payouts: { [p.id]: 0, [opp.id]: won },
        hero: { handName: handNameOf(state, 0) },
        villain: { handName: handNameOf(state, 1) }
      };
      return;
    }
    case 'check': {
      if (callAmount !== 0) return; // illegal
      state.log.push(`${p.name} checks`);
      if (state.lastActionType === 'check' && !state.awaitingResponse) {
        // two checks end the street
        dealNextStreet(state);
      } else {
        state.lastActionType = 'check';
        state.toAct = other(idx);
      }
      return;
    }
    case 'call': {
      const toPay = Math.min(callAmount, p.stack);
      if (toPay <= 0) return; // nothing to call
      p.stack -= toPay;
      p.bet += toPay;
      state.pot += toPay;
      if (p.stack === 0) p.allIn = true;
      state.log.push(`${p.name} calls ${toPay}`);
      state.awaitingResponse = false;
      state.lastActionType = 'call';

      // bets matched -> move to next street or showdown after river
      if (p.bet === opp.bet) {
        dealNextStreet(state);
        if (state.phase === 'showdown') {
          state.toAct = -1;
        }
      } else {
        state.toAct = other(idx);
      }
      // If after the call everyone is all-in (or no actions), auto-run to showdown
      autoAdvanceIfLocked(state);
      return;
    }
    case 'raise': {
      // interpret as bet if currentBet==0
      const minTo = minRaiseTo(state);
      let raiseTo = Number(amount);
      if (!Number.isFinite(raiseTo)) return; // bad input
      raiseTo = Math.max(minTo, raiseTo);
      // cap to all-in
      const maxTo = p.bet + p.stack; // total you can put in
      raiseTo = Math.min(raiseTo, maxTo);
      const add = raiseTo - p.bet;
      if (add <= 0) return; // nothing to add

      const previousBet = state.currentBet;
      p.stack -= add;
      p.bet = raiseTo;
      state.pot += add;
      if (p.stack === 0) p.allIn = true;

      state.lastRaiseSize = Math.max(raiseTo - previousBet, BIG_BLIND);
      state.currentBet = raiseTo;
      state.awaitingResponse = true;
      state.lastActionType = 'raise';
      state.log.push(
        state.currentBet === add && previousBet === 0
          ? `${p.name} bets ${add}`
          : `${p.name} raises to ${raiseTo}`
      );
      state.toAct = other(idx);
      // If opponent cannot respond (e.g., all-in prevents further actions), auto-advance
      autoAdvanceIfLocked(state);
      return;
    }
    default:
      return;
  }
}

function runVillainAuto(state) {
  // simple, random-ish villain decisions until hero's turn or street change/showdown
  while (state.phase !== 'showdown' && state.toAct === 1) {
      const actions = getAvailableActions(state, 1);
      if (actions.length === 0) break;
      // pick action limited to allowed set
      const p = Math.random();
      let act = actions[0];
      let amt = undefined;
      const callAmt = Math.max(0, state.currentBet - state.players[1].bet);
      if (actions.includes('fold') && callAmt > 0 && p < 0.1) {
        act = 'fold';
      } else if (actions.includes('raise') && p < 0.25) {
        act = 'raise';
        const minTo = minRaiseTo(state);
        // pick a modest raise
        amt = Math.min(minTo + BIG_BLIND, state.players[1].bet + state.players[1].stack);
      } else if (actions.includes('call') && callAmt > 0) {
        act = 'call';
      } else if (actions.includes('check')) {
        act = 'check';
      } else if (actions.includes('fold')) {
        act = 'fold';
      }

      applyAction(state, 1, act, amt);

      // if a street just advanced and it's post-flop, loop may continue with villain first or hero depending on toAct
      if (state.phase === 'showdown') break;
      // stop if it's now hero's turn
      if (state.toAct === 0) break;
  }
}

function toSnapshot(state) {
  const villainHidden = state.phase !== 'showdown';
  const mapName = (n) => (n === 'Hero' ? 'Player' : n === 'Villain' ? 'Bot' : n);
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
      name: mapName(p.name),
      stack: p.stack,
      bet: p.bet,
      folded: p.folded,
      hand: i === 1 && villainHidden ? [null, null] : [...p.hand]
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
  const heroCards = [...state.players[0].hand, ...state.board];
  const vilCards = [...state.players[1].hand, ...state.board];
  if (heroCards.some(c => !c) || vilCards.some(c => !c)) return; // safety
  const hEval = evaluate7(heroCards);
  const vEval = evaluate7(vilCards);
  const cmp = compareEval(hEval, vEval);

  let heroWin = 0;
  let vilWin = 0;
  if (cmp > 0) {
    // a.cat higher wins; but compareEval returns a.cat-b.cat; we compared a-b. We passed (a=hEval,b=vEval) returns positive if hero better.
    heroWin = state.pot;
  } else if (cmp < 0) {
    vilWin = state.pot;
  } else {
    // split
    heroWin = Math.floor(state.pot / 2);
    vilWin = state.pot - heroWin; // odd chip to villain
  }

  state.players[0].stack += heroWin;
  state.players[1].stack += vilWin;
  state.result = {
    winner: cmp > 0 ? state.players[0].id : cmp < 0 ? state.players[1].id : 'split',
    reason: 'showdown',
    payouts: { [state.players[0].id]: heroWin, [state.players[1].id]: vilWin },
    hero: { handName: hEval.name },
    villain: { handName: vEval.name }
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
