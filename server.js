import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, 'public');
const COMMENTS_FILE = path.join(__dirname, 'comments.json');

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// leyfðar myndategundir
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif']);

function safeJoin(base, target) {
  const targetPath = path.normalize(path.join(base, target));

  if (!targetPath.startsWith(base)) {
    throw new Error('Invalid path');
  }

  return targetPath;
}

// Myndalisti
app.get('/api/list', (req, res) => {
  try {
    const dir = String(req.query.dir || '');
    const abs = safeJoin(PUBLIC_DIR, dir);

    const files = fs
      .readdirSync(abs, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => d.name)
      .filter((name) => IMG_EXT.has(path.extname(name).toLowerCase()))
      .sort((a, b) =>
        a.localeCompare(b, undefined, {
          numeric: true,
        }),
      );

    res.json({
      dir,
      files: files.map((f) => `/${dir.replace(/\\/g, '/')}/${f}`),
    });
  } catch (err) {
    res.status(400).json({
      error: 'Could not list directory',
    });
  }
});

// Ná í comments
app.get('/api/comments', (req, res) => {
  try {
    if (!fs.existsSync(COMMENTS_FILE)) {
      return res.json({});
    }

    const comments = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf8'));

    res.json(comments);
  } catch (err) {
    res.status(500).json({
      error: 'Could not load comments',
    });
  }
});

// Vista comment
app.post('/api/comment', (req, res) => {
  try {
    const { image, comment } = req.body;

    let comments = {};

    if (fs.existsSync(COMMENTS_FILE)) {
      comments = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf8'));
    }

    comments[image] = {
      comment,
      updated: new Date().toISOString(),
    };

    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      error: 'Could not save comment',
    });
  }
});

app.listen(3000, () => {
  console.log('Server running: http://localhost:3000');
});
