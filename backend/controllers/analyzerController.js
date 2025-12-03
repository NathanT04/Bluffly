const equityService = require('../services/equityService');
const { getGtoRecommendation } = require('../services/gtoSolverService');
const { getPlayExplanation } = require('../services/geminiService');
const userService = require('../services/userService');

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

const formatPotOddsRatio = equityPercentage => {
  const equity = equityPercentage / 100;
  if (!Number.isFinite(equity) || equity <= 0) {
    return '0.00 : 1';
  }
  if (equity >= 1) {
    return '∞ : 1';
  }
  const ratio = 1 / equity - 1;
  return `${ratio.toFixed(2)} : 1`;
};

exports.analyzeEquity = async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    const user = userId ? await userService.findUserById(userId) : null;
    const plan = user?.plan === 'premium' ? 'premium' : 'free';
    const hasPremiumAccess = plan === 'premium';

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
    const gto = hasPremiumAccess
      ? getGtoRecommendation(hero, board)
      : {
          status: 'unavailable',
          message: 'Upgrade to premium to unlock GTO solver suggestions.'
        };

    let aiExplanation = null;
    if (hasPremiumAccess) {
      try {
        const potOddsRatio = formatPotOddsRatio(result?.equity?.percentage ?? 0);
        aiExplanation = await getPlayExplanation({
          hero,
          board,
          equityPercentage: result?.equity?.percentage ?? 0,
          potOddsRatio,
          gtoSummary: gto
        });
      } catch (geminiError) {
        console.error('Failed to generate Gemini explanation', geminiError);
      }
    }

    return res.json({
      ...result,
      gto,
      aiExplanation,
      plan
    });
  } catch (error) {
    return next(error);
  }
};
