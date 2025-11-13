// Test data simulating quiz results
const dummyQuizResults = [
  {
    id: 'result-1',
    user: 'user-1',
    difficulty: 'beginner',
    correct: 8,
    total: 10,
    percentage: 80,
    metadata: { lessonId: 'lesson-1' },
    submittedAt: new Date('2024-05-20T12:00:00.000Z').toISOString()
  },
  {
    id: 'result-2',
    user: 'user-2',
    difficulty: 'intermediate',
    correct: 9,
    total: 10,
    percentage: 90,
    metadata: { lessonId: 'lesson-2' },
    submittedAt: new Date('2024-05-21T12:00:00.000Z').toISOString()
  },
  {
    id: 'result-3',
    user: 'user-3',
    difficulty: 'beginner',
    correct: 7,
    total: 10,
    percentage: 70,
    metadata: { lessonId: 'lesson-3' },
    submittedAt: new Date('2024-05-22T12:00:00.000Z').toISOString()
  }
];

const listQuizResults = ({ difficulty, limit } = {}) => {
  let results = [...dummyQuizResults];

  if (typeof difficulty === 'string' && difficulty.trim().length > 0) {
    const normalized = difficulty.trim().toLowerCase();
    results = results.filter((result) => result.difficulty === normalized);
  }

  if (Number.isFinite(limit)) {
    const safeLimit = Math.max(0, Math.min(dummyQuizResults.length, Math.floor(limit)));
    results = results.slice(0, safeLimit);
  }

  return { count: results.length, results };
};

describe('listQuizResults helper returns quiz result objects', () => {
  test('returns at least three quiz results with count metadata', () => {
    const payload = listQuizResults();

    expect(payload).toHaveProperty('count');
    expect(payload).toHaveProperty('results');
    expect(Array.isArray(payload.results)).toBe(true);
    expect(payload.count).toBeGreaterThanOrEqual(3);
    expect(payload.results.length).toBe(payload.count);
  });

  test('each quiz result object contains expected fields and types', () => {
    const { results } = listQuizResults();

    results.forEach((quizResult) => {
      expect(typeof quizResult).toBe('object');

      expect(typeof quizResult.id).toBe('string');
      expect(quizResult.id.length).toBeGreaterThan(0);

      expect(typeof quizResult.user).toBe('string');
      expect(quizResult.user.length).toBeGreaterThan(0);

      expect(typeof quizResult.difficulty).toBe('string');
      expect(typeof quizResult.correct).toBe('number');
      expect(typeof quizResult.total).toBe('number');
      expect(typeof quizResult.percentage).toBe('number');
      expect(quizResult.correct).toBeGreaterThanOrEqual(0);
      expect(quizResult.total).toBeGreaterThan(0);
      expect(quizResult.percentage).toBeGreaterThanOrEqual(0);
      expect(quizResult.percentage).toBeLessThanOrEqual(100);

      expect(typeof quizResult.metadata).toBe('object');
      expect(typeof quizResult.submittedAt).toBe('string');
    });
  });

  test('supports filtering by difficulty without touching authentication', () => {
    const beginnerPayload = listQuizResults({ difficulty: 'Beginner' });

    expect(beginnerPayload.count).toBe(2);
    expect(beginnerPayload.results.every((r) => r.difficulty === 'beginner')).toBe(true);
  });

  test('supports limiting the number of returned results', () => {
    const limitedPayload = listQuizResults({ limit: 1 });

    expect(limitedPayload.count).toBe(1);
    expect(limitedPayload.results.length).toBe(1);
    expect(limitedPayload.results[0].id).toBe('result-1');
  });
});
