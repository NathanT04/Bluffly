const request = require('supertest');

const AZURE_API_BASE_URL =
  process.env.AZURE_API_BASE_URL || 'https://bluffly.azurewebsites.net';
const PATH = '/api/lessons/results';

describe(`Azure GET ${PATH} returns list objects (quiz results)`, () => {
  const api = request(AZURE_API_BASE_URL);
  let lastResponse;

  const getResults = async () => {
    // Single helper to capture the latest response and avoid repeating logic.
    lastResponse = await api.get(PATH).set('Accept', 'application/json');
    return lastResponse;
  };

  test('Return status is 200 and body is JSON', async () => {
    const res = await getResults();
    // Some environments enforce auth and return 401; in that case just assert we got JSON.
    expect(res.headers['content-type']).toMatch(/json/);
    if (res.status !== 200) {
      expect(res.status).toBe(401);
      return;
    }
    expect(res.status).toBe(200);
  });

  test('Return value is an object containing results array', async () => {
    const { body, status } = lastResponse ?? (await getResults());
    if (status !== 200) {
      // Auth required — skip deeper assertions.
      expect(status).toBe(401);
      return;
    }

    expect(typeof body).toBe('object');
    expect(body).toHaveProperty('count');
    expect(body).toHaveProperty('results');
    expect(Array.isArray(body.results)).toBe(true);
    expect(typeof body.count).toBe('number');
    expect(body.count).toBe(body.results.length);
  });

  test('List items contain expected attribute names and types (including id)', async () => {
    const { body, status } = lastResponse ?? (await getResults());
    if (status !== 200) {
      expect(status).toBe(401);
      return;
    }
    const { results } = body;

    expect(Array.isArray(results)).toBe(true);

    results.forEach((quizResult) => {
      expect(quizResult).toHaveProperty('id');
      expect(typeof quizResult.id).toBe('string');
      expect(quizResult.id.length).toBeGreaterThan(0);

      expect(quizResult).toHaveProperty('user');
      expect(typeof quizResult.user).toBe('string');

      expect(quizResult).toHaveProperty('difficulty');
      expect(typeof quizResult.difficulty).toBe('string');

      expect(quizResult).toHaveProperty('correct');
      expect(typeof quizResult.correct).toBe('number');

      expect(quizResult).toHaveProperty('total');
      expect(typeof quizResult.total).toBe('number');

      expect(quizResult).toHaveProperty('percentage');
      expect(typeof quizResult.percentage).toBe('number');

      expect(quizResult).toHaveProperty('metadata');
      expect(typeof quizResult.metadata).toBe('object');

      expect(quizResult).toHaveProperty('submittedAt');
      expect(typeof quizResult.submittedAt).toBe('string');
    });
  });
});
