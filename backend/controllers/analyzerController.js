const equityService = require('../services/equityService');

const CARD_PATTERN = /^(A|K|Q|J|T|9|8|7|6|5|4|3|2)(s|h|d|c)$/i;
const MAX_BOARD_CARDS = 5;

const normalizeCard = card => {
  if (typeof card !== 'string') {
    return null;
  }

  const trimmed = card.trim();
  if (!trimmed) {
    return null;
  }

  const rank = trimmed[0]?.toUpperCase();
  const suit = trimmed.slice(1)?.toLowerCase();
  const normalized = `${rank ?? ''}${suit ?? ''}`;

  return CARD_PATTERN.test(normalized) ? normalized : null;
};


const parseHand = (hand, expectedLength) => {
  if (!Array.isArray(hand) || hand.length !== expectedLength) {
    return null;
  }

  const cards = hand
    .map(entry => normalizeCard(entry))
    .filter(card => card !== null);

  return cards.length === expectedLength ? cards : null;
};

const parseBoard = board => {
  if (!Array.isArray(board)) {
    return null;
  }

  if (board.length > MAX_BOARD_CARDS) {
    return null;
  }

  const cards = board
    .map(entry => normalizeCard(entry))
    .filter(card => card !== null);

  return cards.length === board.length ? cards : null;
};

const hasDuplicates = cards => {
  const set = new Set(cards);
  return set.size !== cards.length;
};

exports.analyzeEquity = (req, res, next) => {
  try {
    const hero = parseHand(req.body?.hero, 2);
    const board = parseBoard(req.body?.board ?? []);

    if (!hero) {
      return res.status(400).json({
        error: 'Hero hand must include exactly two valid cards.'
      });
    }

    if (board === null) {
      return res.status(400).json({
        error: 'Board cards must be an array of up to five valid cards.'
      });
    }

    if (hasDuplicates([...hero, ...board])) {
      return res.status(400).json({
        error: 'Duplicate cards detected between hero hand and board.'
      });
    }

    const iterations = Number.isFinite(req.body?.iterations)
      ? Math.floor(req.body.iterations)
      : undefined;

    const result = equityService.calculateHeroEquity(hero, board, iterations);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
