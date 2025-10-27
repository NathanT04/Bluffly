const { calculateEquity } = require('poker-odds');

const DEFAULT_ITERATIONS = 25000;
const RANDOM_OPPONENT = ['..', '..'];

const sanitizeIterations = iterations => {
  if (typeof iterations !== 'number' || !Number.isFinite(iterations)) {
    return DEFAULT_ITERATIONS;
  }

  const rounded = Math.floor(iterations);
  return rounded > 0 ? rounded : DEFAULT_ITERATIONS;
};

const toEquitySummary = (heroResult, iterations) => {
  const totalRuns = heroResult.count || iterations;
  const percentage =
    totalRuns > 0 ? ((heroResult.wins + heroResult.ties / 2) / totalRuns) * 100 : 0;

  return {
    equity: {
      percentage,
      wins: heroResult.wins,
      ties: heroResult.ties,
      count: heroResult.count
    },
    iterations: totalRuns
  };
};

exports.calculateHeroEquity = (hero, board, iterations) => {
  const simIterations = sanitizeIterations(iterations);

  try {
    const [heroResult] = calculateEquity([hero, RANDOM_OPPONENT], board, simIterations);
    const summary = toEquitySummary(heroResult, simIterations);

    return {
      ...summary,
      board
    };
  } catch (error) {
    const wrappedError = new Error(
      'Failed to calculate equity. Please verify the provided cards and try again.'
    );
    wrappedError.statusCode = 500;
    wrappedError.cause = error;
    throw wrappedError;
  }
};
