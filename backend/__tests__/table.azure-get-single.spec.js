const request = require('supertest');

const AZURE_API_BASE_URL =
  process.env.AZURE_API_BASE_URL || 'https://bluffly.azurewebsites.net';

// These tests hit the deployed Azure endpoint to ensure the contract matches the local table tests.
describe('Azure GET /api/table/:id returns a single table snapshot', () => {
  const api = request(AZURE_API_BASE_URL);
  let tableId;

  beforeAll(async () => {
    const res = await api
      .post('/api/table')
      .send({ players: 2, startingStack: 100 })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(typeof res.body).toBe('object');
    expect(res.body).toHaveProperty('id');
    tableId = res.body.id;
  });

  test('Return status is 200 and body is JSON', async () => {
    await api.get(`/api/table/${tableId}`).expect('Content-Type', /json/).expect(200);
  });

  test('Return value is an object with expected attribute names', async () => {
    const { body } = await api.get(`/api/table/${tableId}`).expect(200);

    expect(typeof body).toBe('object');
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('phase');
    expect(body).toHaveProperty('pot');
    expect(body).toHaveProperty('players');
  });

  test('Item contains expected attribute types and an id', async () => {
    const { body } = await api.get(`/api/table/${tableId}`).expect(200);

    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(0);
    expect(typeof body.phase).toBe('string');
    expect(typeof body.pot).toBe('number');
    expect(Array.isArray(body.players)).toBe(true);

    const firstPlayer = body.players[0];
    expect(typeof firstPlayer).toBe('object');
    expect(typeof firstPlayer.id).toBe('string');
    expect(firstPlayer.id.length).toBeGreaterThan(0);
    expect(typeof firstPlayer.name).toBe('string');
    expect(typeof firstPlayer.stack).toBe('number');
  });
});
