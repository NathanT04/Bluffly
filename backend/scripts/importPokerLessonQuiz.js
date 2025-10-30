const fs = require('node:fs/promises');
const path = require('node:path');
const { MongoClient } = require('mongodb');


function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  const rows = lines.slice(1).map((line) => splitCsvLine(line));

  return { headers, rows };
}

function splitCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim().replace(/^"|"$/g, ''));
}

function normalizeRow(headers, values) {
  return headers.reduce((acc, header, index) => {
    acc[header] = values[index] ?? '';
    return acc;
  }, {});
}

function transformRow(raw) {
  const toInt = (value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const entry = {
    difficulty: raw.difficulty?.trim() || undefined,
    category: raw.category?.trim() || undefined,
    question: raw.question?.trim() || undefined,
    option_1: raw.option_1?.trim() || undefined,
    option_2: raw.option_2?.trim() || undefined,
    option_3: raw.option_3?.trim() || undefined,
    option_4: raw.option_4?.trim() || undefined,
    correct_answer: raw.correct_answer?.trim() || undefined,
    correct_answer_index: toInt(raw.correct_answer_index),
    explanation: raw.explanation?.trim() || undefined,
    tags: raw.tags
      ? raw.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [],
    id: raw.id?.trim() || undefined,
  };

  entry.options = [entry.option_1, entry.option_2, entry.option_3, entry.option_4].filter(
    (option) => option !== undefined && option.length > 0
  );

  return entry;
}

async function readCsv(filePath) {
  const resolvedPath = path.resolve(filePath);
  const buffer = await fs.readFile(resolvedPath, 'utf8');
  const { headers, rows } = parseCsv(buffer);
  if (headers.length === 0) {
    throw new Error(`CSV file at ${resolvedPath} does not contain a header row.`);
  }
  return rows.map((values) => transformRow(normalizeRow(headers, values)));
}

async function importCsvEntries({ uri, dbName, collectionName, csvPath }) {
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  const client = new MongoClient(uri);

  try {
    const documents = await readCsv(csvPath);
    if (documents.length === 0) {
      console.log('No rows found in CSV; nothing to insert.');
      return;
    }

    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const operations = documents
      .filter((doc) => doc.id)
      .map((doc) => ({
        updateOne: {
          filter: { id: doc.id },
          update: { $set: doc },
          upsert: true,
        },
      }));

    if (operations.length === 0) {
      throw new Error('No rows contained an "id" column to use for upserting.');
    }

    const result = await collection.bulkWrite(operations, { ordered: false });

    console.log(
      `Upserted ${result.upsertedCount} documents, matched ${result.matchedCount}, modified ${result.modifiedCount}.`
    );
  } finally {
    await client.close();
  }
}

async function main() {
  const csvDefaultPath = path.resolve(__dirname, '../../pokerLessonQuiz.csv');
  const csvPath = process.env.CSV_PATH ? path.resolve(process.env.CSV_PATH) : csvDefaultPath;

  await importCsvEntries({
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DB || 'bluffly',
    collectionName: process.env.MONGODB_COLLECTION || 'pokerLessonQuiz',
    csvPath,
  });
}

main().catch((error) => {
  console.error('Failed to import CSV into MongoDB:', error);
  process.exitCode = 1;
});

