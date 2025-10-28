const tables = new Map();

function saveTable(id, state) {
  tables.set(id, state);
}

function getTable(id) {
  return tables.get(id) || null;
}

module.exports = {
  saveTable,
  getTable
};

