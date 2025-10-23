/* Simple local upload server to save files under public/upload/<category>
 * Enhanced: supports nested role/entity/subfolder paths: /upload/:role/:entityId/:subfolder?
 */
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true }));
app.use(express.json());

// Ensure a directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Sanitize a single path segment (prevent traversal and illegal chars)
function safeSegment(seg) {
  const clean = String(seg || '').trim().replace(/[^a-zA-Z0-9._-]/g, '');
  return clean;
}

// Multer storage that routes files by category or nested role/entity/subfolder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsRoot = path.join(__dirname, '..', 'public', 'upload');
    let dest;

    // Nested route: /upload/:role/:entityId/:subfolder?
    if (req.params && req.params.role && req.params.entityId) {
      const role = safeSegment(req.params.role);
      const entityId = safeSegment(req.params.entityId);
      const subfolder = safeSegment(req.params.subfolder || '');
      dest = subfolder
        ? path.join(uploadsRoot, role, entityId, subfolder)
        : path.join(uploadsRoot, role, entityId);
    } else {
      // Simple category route: /upload/:category
      const category = safeSegment(req.params.category || '');
      dest = path.join(uploadsRoot, category);
    }
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const name = `${randomUUID()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

app.post('/upload/:category', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const category = safeSegment(req.params.category || '');
    // Public URL relative to Vite dev server origin
    const url = `/upload/${category}/${req.file.filename}`;
    return res.json({ url, filename: req.file.filename, category });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

// Nested role/entity/subfolder upload
app.post('/upload/:role/:entityId/:subfolder?', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const role = safeSegment(req.params.role || '');
    const entityId = safeSegment(req.params.entityId || '');
    const subfolder = safeSegment(req.params.subfolder || '');
    if (!role || !entityId) {
      return res.status(400).json({ error: 'Missing role or entityId' });
    }
    const base = subfolder ? `/upload/${role}/${entityId}/${subfolder}` : `/upload/${role}/${entityId}`;
    const url = `${base}/${req.file.filename}`;
    return res.json({ url, filename: req.file.filename, role, entityId, subfolder });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

// List files for a simple category: GET /files/:category
app.get('/files/:category', (req, res) => {
  try {
    const uploadsRoot = path.join(__dirname, '..', 'public', 'upload');
    const category = safeSegment(req.params.category || '');
    const dirPath = path.join(uploadsRoot, category);
    ensureDir(dirPath);
    const files = fs.readdirSync(dirPath)
      .filter(name => fs.statSync(path.join(dirPath, name)).isFile())
      .map(name => ({ filename: name, url: `/upload/${category}/${name}` }));
    return res.json({ category, files });
  } catch (err) {
    console.error('List files error:', err);
    return res.status(500).json({ error: 'Failed to list files' });
  }
});

// Delete a file in a simple category: DELETE /files/:category/:filename
app.delete('/files/:category/:filename', (req, res) => {
  try {
    const uploadsRoot = path.join(__dirname, '..', 'public', 'upload');
    const category = safeSegment(req.params.category || '');
    const filename = safeSegment(req.params.filename || '');
    if (!category || !filename) {
      return res.status(400).json({ error: 'Missing category or filename' });
    }
    const filePath = path.join(uploadsRoot, category, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    fs.unlinkSync(filePath);
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete file error:', err);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Optional: List files for nested path: GET /files/:role/:entityId/:subfolder?
app.get('/files/:role/:entityId/:subfolder?', (req, res) => {
  try {
    const uploadsRoot = path.join(__dirname, '..', 'public', 'upload');
    const role = safeSegment(req.params.role || '');
    const entityId = safeSegment(req.params.entityId || '');
    const subfolder = safeSegment(req.params.subfolder || '');
    if (!role || !entityId) {
      return res.status(400).json({ error: 'Missing role or entityId' });
    }
    const dirPath = subfolder
      ? path.join(uploadsRoot, role, entityId, subfolder)
      : path.join(uploadsRoot, role, entityId);
    ensureDir(dirPath);
    const files = fs.readdirSync(dirPath)
      .filter(name => fs.statSync(path.join(dirPath, name)).isFile())
      .map(name => ({ filename: name, url: subfolder ? `/upload/${role}/${entityId}/${subfolder}/${name}` : `/upload/${role}/${entityId}/${name}` }));
    return res.json({ role, entityId, subfolder, files });
  } catch (err) {
    console.error('List nested files error:', err);
    return res.status(500).json({ error: 'Failed to list nested files' });
  }
});


app.listen(PORT, () => {
  console.log(`Local upload server listening on http://localhost:${PORT}`);
});