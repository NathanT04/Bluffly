const request = require('supertest');

const LIVE_BASE_URL = process.env.LIVE_BASE_URL || 'https://bluffly.azurewebsites.net';
const PATH = '/api/table';

describe('POST /api/table (live Azure)', () => {
  // Allow extra time for network
  jest.setTimeout(20000);

  test('creates a single table snapshot with expected shape', async () => {
    const payload = { players: 2, startingStack: 150 };

    const res = await request(LIVE_BASE_URL)
      .post(PATH)
      .set('Accept', 'application/json')
      .set('Connection', 'close') // avoid keep-alive handles
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(201);

    const body = res.body;
    expect(typeof body).toBe('object');
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(0);

    expect(body).toHaveProperty('phase');
    expect(typeof body.phase).toBe('string');

    expect(body).toHaveProperty('pot');
    expect(typeof body.pot).toBe('number');

    expect(body).toHaveProperty('board');
    expect(Array.isArray(body.board)).toBe(true);

    expect(body).toHaveProperty('players');
    expect(Array.isArray(body.players)).toBe(true);
    expect(body.players.length).toBe(payload.players);

    body.players.forEach((player) => {
      expect(typeof player).toBe('object');
      expect(player).toHaveProperty('id');
      expect(typeof player.id).toBe('string');
      expect(player.id.length).toBeGreaterThan(0);

      expect(player).toHaveProperty('name');
      expect(typeof player.name).toBe('string');

      expect(player).toHaveProperty('stack');
      expect(typeof player.stack).toBe('number');

      expect(player).toHaveProperty('hand');
      expect(Array.isArray(player.hand)).toBe(true);
    });

    expect(body).toHaveProperty('availableActions');
    expect(Array.isArray(body.availableActions)).toBe(true);
    expect(body.availableActions.length).toBeGreaterThan(0);

    expect(body).toHaveProperty('callAmount');
    expect(typeof body.callAmount).toBe('number');
  });
});
