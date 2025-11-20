const { createGame, toSnapshot, applyAction, runVillainAuto } = require('../engine/gameEngine');
const { saveTable, getTable } = require('../engine/store');

exports.createTable = (req, res, next) => {
  try {
    const players = Number.isFinite(req.body?.players) ? Math.floor(req.body.players) : 2;
    const startingStack = Number.isFinite(req.body?.startingStack)
      ? Math.floor(req.body.startingStack)
      : 100;

    const state = createGame({ players, startingStack });
    if (state.toAct > 0) {
      runVillainAuto(state);
    }
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

exports.act = (req, res, next) => {
  try {
    const table = getTable(req.params.id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const action = String(req.body?.action || '').toLowerCase();
    const amount = req.body?.amount;
    const allowed = ['fold', 'check', 'call', 'raise'];
    if (!allowed.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Hero is index 0
    applyAction(table, 0, action, amount);

    // Let the villain play automatically until it's hero's turn again or hand ends
    if (table.phase !== 'showdown') {
      runVillainAuto(table);
    }

    // Edge case: if no one can act (both all-in/folded), the engine will
    // auto-advance streets to showdown before returning the snapshot.
    // (Handled inside engine via autoAdvanceIfLocked invoked from applyAction.)

    return res.json(toSnapshot(table));
  } catch (err) {
    return next(err);
  }
};
