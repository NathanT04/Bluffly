const { randomUUID } = require('crypto');
const { createDeck, shuffle, draw } = require('./deck');

const PHASES = ['preflop', 'flop', 'turn', 'river', 'showdown'];

function createPlayer(id, name, stack) {
  return { id, name, stack, hand: [], folded: false, bet: 0 };
}

function createGame({ players = 2, startingStack = 100 } = {}) {
  const id = randomUUID();
  const deck = shuffle(createDeck());

  const playerList = Array.from({ length: Math.max(2, Math.min(6, players)) }).map((_, i) =>
    createPlayer(`${i + 1}`, i === 0 ? 'Hero' : `Villain ${i}` , startingStack)
  );

  // deal 2 to each
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
    _deck: deck
  };

  return state;
}

function nextStreet(state) {
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
  }
  return state;
}

function toSnapshot(state) {
  return {
    id: state.id,
    phase: state.phase,
    dealer: state.dealer,
    toAct: state.toAct,
    pot: state.pot,
    board: [...state.board],
    players: state.players.map(p => ({
      id: p.id,
      name: p.name,
      stack: p.stack,
      bet: p.bet,
      folded: p.folded,
      hand: [...p.hand]
    })),
    availableActions: state.phase === 'showdown' ? [] : ['next']
  };
}

module.exports = {
  createGame,
  nextStreet,
  toSnapshot,
  PHASES
};

