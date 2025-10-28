const { createGame, nextStreet, toSnapshot } = require('../engine/gameEngine');
const { saveTable, getTable } = require('../engine/store');

exports.createTable = (req, res, next) => {
  try {
    const players = Number.isFinite(req.body?.players) ? Math.floor(req.body.players) : 2;
    const startingStack = Number.isFinite(req.body?.startingStack)
      ? Math.floor(req.body.startingStack)
      : 100;

    const state = createGame({ players, startingStack });
    saveTable(state.id, state);
    return res.status(201).json(toSnapshot(state));
  } catch (err) {
    return next(err);
  }
};

exports.getTable = (req, res, next) => {
  try {
    const table = getTable(req.params.id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    return res.json(toSnapshot(table));
  } catch (err) {
    return next(err);
  }
};

exports.next = (req, res, next) => {
  try {
    const table = getTable(req.params.id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    if (table.phase === 'showdown') {
      return res.json(toSnapshot(table));
    }
    nextStreet(table);
    return res.json(toSnapshot(table));
  } catch (err) {
    return next(err);
  }
};

