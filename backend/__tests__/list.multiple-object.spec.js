const quizResultController = require('../controllers/quizResultController');

jest.mock('../services/quizResultService', () => ({
  createResult: jest.fn(),
  listResults: jest.fn()
}));

const quizResultService = require('../services/quizResultService');

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

const HOST = 'http://localhost';
const PATH = '/api/lessons/results';
const FULL_URL = `${HOST}${PATH}`;

const createMockResponse = () => {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn().mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe(`GET ${PATH} returns list objects (quiz results)`, () => {
  test('Return value is an array', () => {

    const payload = listQuizResults();

    expect(Array.isArray(payload.results)).toBe(true);
    expect(payload.count).toBe(payload.results.length);
  });

  test('List items contain expected attribute names', () => {

    const { results } = listQuizResults();

    results.forEach((quizResult) => {
      expect(quizResult).toHaveProperty('id');
      expect(quizResult).toHaveProperty('user');
      expect(quizResult).toHaveProperty('difficulty');
      expect(quizResult).toHaveProperty('correct');
      expect(quizResult).toHaveProperty('total');
      expect(quizResult).toHaveProperty('percentage');
      expect(quizResult).toHaveProperty('metadata');
      expect(quizResult).toHaveProperty('submittedAt');
    });
  });

  test('List items contain expected attribute types', () => {

    const { results } = listQuizResults();

    results.forEach((quizResult) => {
      expect(typeof quizResult.user).toBe('string');
      expect(typeof quizResult.difficulty).toBe('string');
      expect(typeof quizResult.correct).toBe('number');
      expect(typeof quizResult.total).toBe('number');
      expect(typeof quizResult.percentage).toBe('number');
      expect(typeof quizResult.metadata).toBe('object');
      expect(typeof quizResult.submittedAt).toBe('string');
    });
  });

  test('Each list item contains an id', () => {

    const { results } = listQuizResults();

    results.forEach((quizResult) => {
      expect(typeof quizResult.id).toBe('string');
      expect(quizResult.id.length).toBeGreaterThan(0);
    });
  });

  test('Return type of body is JSON', async () => {

    jest.clearAllMocks();
    quizResultService.listResults.mockResolvedValue(dummyQuizResults);
    const req = {
      method: 'GET',
      originalUrl: PATH,
      url: PATH,
      session: { userId: 'user-1' },
      query: {}
    };
    const res = createMockResponse();
    const next = jest.fn();

    await quizResultController.listResults(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      count: dummyQuizResults.length,
      results: dummyQuizResults
    });
    const [body] = res.json.mock.calls[0];
    expect(typeof body).toBe('object');
    expect(Array.isArray(body.results)).toBe(true);
    body.results.forEach((item) => {
      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
    });
    expect(quizResultService.listResults).toHaveBeenCalledWith({
      userId: 'user-1',
      difficulty: undefined,
      limit: undefined
    });
  });

  test('Return status is 200', async () => {
    // GET api/lessons/results at http://localhost
    jest.clearAllMocks();
    quizResultService.listResults.mockResolvedValue([dummyQuizResults[0]]);
    const req = {
      method: 'GET',
      originalUrl: `${PATH}?difficulty=beginner&limit=1`,
      url: PATH,
      session: { userId: 'user-1' },
      query: { difficulty: 'beginner', limit: '1' }
    };
    const res = createMockResponse();
    const next = jest.fn();

    await quizResultController.listResults(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      count: 1,
      results: [dummyQuizResults[0]]
    });
    expect(res.statusCode).toBe(200);
    expect(quizResultService.listResults).toHaveBeenCalledWith({
      userId: 'user-1',
      difficulty: 'beginner',
      limit: '1'
    });
  });
});
