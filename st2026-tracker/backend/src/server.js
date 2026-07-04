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

app.get('/api/timeline', async (req, res) => {
  const data = await readData();
  res.json(data);
});

app.patch('/api/timeline/items/:id', async (req, res) => {
  const data = await readData();
  const item = data.items.find((it) => it.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  if (typeof req.body.done === 'boolean') {
    item.done = req.body.done;
  }
  if (typeof req.body.notes === 'string') {
    item.notes = req.body.notes;
  }
  await writeData(data);
  res.json(item);
});

app.listen(PORT, () => {
  console.log(`ST-2026 tracker backend running on http://localhost:${PORT}`);
});
