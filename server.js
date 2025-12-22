import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, 'public');

// serve static files
app.use(express.static(PUBLIC_DIR));

// allow-list image extensions
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function safeJoin(base, target) {
  const targetPath = path.normalize(path.join(base, target));
  if (!targetPath.startsWith(base)) throw new Error('Invalid path');
  return targetPath;
}

// GET /api/list?dir=2025/nov/session-1
app.get('/api/list', (req, res) => {
  try {
    const dir = String(req.query.dir || '');
    const abs = safeJoin(PUBLIC_DIR, dir);

    const files = fs
      .readdirSync(abs, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => d.name)
      .filter((name) => IMG_EXT.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    res.json({
      dir,
      files: files.map((f) => `/${dir.replace(/\\/g, '/')}/${f}`),
    });
  } catch (e) {
    res.status(400).json({ error: 'Could not list directory' });
  }
});

app.listen(3000, () => {
  console.log('http://localhost:3000');
});
