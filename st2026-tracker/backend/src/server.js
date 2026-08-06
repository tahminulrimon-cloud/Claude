import express from 'express';
import cors from 'cors';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '..', 'data', 'timeline.json');
const PORT = process.env.PORT || 4026;

const app = express();
app.use(cors());
app.use(express.json());

async function readData() {
  const raw = await readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function writeData(data) {
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

// Serializes read-modify-write cycles so concurrent PATCH requests can't
// race each other and silently drop an update.
let writeQueue = Promise.resolve();
function serialized(task) {
  const result = writeQueue.then(task);
  writeQueue = result.then(
    () => {},
    () => {},
  );
  return result;
}

app.get('/api/timeline', async (req, res, next) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.patch('/api/timeline/items/:id', async (req, res, next) => {
  try {
    const result = await serialized(async () => {
      const data = await readData();
      const item = data.items.find((it) => it.id === req.params.id);
      if (!item) {
        return { status: 404, body: { error: 'Item not found' } };
      }
      if (typeof req.body.done === 'boolean') {
        item.done = req.body.done;
      }
      if (typeof req.body.notes === 'string') {
        item.notes = req.body.notes;
      }
      await writeData(data);
      return { status: 200, body: item };
    });
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`ST-2026 tracker backend running on http://localhost:${PORT}`);
});
