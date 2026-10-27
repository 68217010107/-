import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'app-state.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function startServer() {
  ensureDataDir();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/state', (_req, res) => {
    try {
      if (!fs.existsSync(STATE_FILE)) {
        res.json({ initialized: false, data: null });
        return;
      }
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      res.json({ initialized: true, data: parsed });
    } catch (error) {
      console.error('Failed to read persisted state:', error);
      res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลที่บันทึกไว้ได้' });
    }
  });

  app.put('/api/state', (req, res) => {
    try {
      ensureDataDir();
      const payload = req.body;
      if (!payload || typeof payload !== 'object') {
        res.status(400).json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' });
        return;
      }
      const tempFile = `${STATE_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tempFile, STATE_FILE);
      res.json({ ok: true, savedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to save state:', error);
      res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลลงเซิร์ฟเวอร์ได้' });
    }
  });

  app.delete('/api/state', (_req, res) => {
    try {
      if (fs.existsSync(STATE_FILE)) {
        fs.unlinkSync(STATE_FILE);
      }
      res.json({ ok: true });
    } catch (error) {
      console.error('Failed to clear state:', error);
      res.status(500).json({ error: 'ไม่สามารถรีเซ็ตข้อมูลได้' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
