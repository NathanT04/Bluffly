const request = require('supertest');
const app = require('../app');

describe('GET /api/table/:id returns a single table snapshot', () => {
  let tableId;

  // test data
  beforeAll(async () => {
    const res = await request(app)
      .post('/api/table')
      .send({ players: 2, startingStack: 100 })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(typeof res.body).toBe('object');
    expect(res.body).toHaveProperty('id');
    tableId = res.body.id;
  });

  test('returns status 200 and JSON body', async () => {
    await request(app)
      .get(`/api/table/${tableId}`)
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('returns a single object with expected attributes and types', async () => {
    const { body } = await request(app).get(`/api/table/${tableId}`).expect(200);

    // Return value is an object
    expect(typeof body).toBe('object');

    // Contains an id
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(0);

    // Expected attribute names and types 
    expect(body).toHaveProperty('phase');
    expect(typeof body.phase).toBe('string');

    expect(body).toHaveProperty('pot');
    expect(typeof body.pot).toBe('number');

    expect(body).toHaveProperty('players');
    expect(Array.isArray(body.players)).toBe(true);
    expect(body.players.length).toBeGreaterThanOrEqual(2);

    const first = body.players[0];
    expect(typeof first).toBe('object');
    expect(first).toHaveProperty('id');
    expect(typeof first.id).toBe('string');
    expect(first).toHaveProperty('name');
    expect(typeof first.name).toBe('string');
    expect(first).toHaveProperty('stack');
    expect(typeof first.stack).toBe('number');
  });

  test('GET returns the exact table we created (ids match)', async () => {
    const { body } = await request(app).get(`/api/table/${tableId}`).expect(200);
    expect(body.id).toBe(tableId);
  });
});

