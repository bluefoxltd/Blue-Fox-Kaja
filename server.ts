import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data Persistence Paths
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'db.json');

// Interface definition for DB
interface DatabaseSchema {
  transactions: any[];
  couponProfile: {
    couponCode: string;
    holderName: string;
    holderPhone: string;
    shopName: string;
    shopAddress: string;
    shopPhone?: string;
    issueDateBS: string;
    validUntilBS: string;
    creditLimit?: number;
    fixedQrPayload: string;
  };
  adminPin: string;
  lastUpdated: number;
}

const DEFAULT_DB: DatabaseSchema = {
  transactions: [],
  couponProfile: {
    couponCode: 'BF-FOX-7821',
    holderName: 'Blue Fox',
    holderPhone: '+977 9802755605',
    shopName: 'Darjeeling momo',
    shopAddress: 'Itahari-6, Sky Plaza',
    shopPhone: '9802755605',
    issueDateBS: '2083-01-01',
    validUntilBS: '2083-12-30',
    creditLimit: 25000,
    fixedQrPayload: '',
  },
  adminPin: '1234',
  lastUpdated: Date.now(),
};

// In-memory active DB
let db: DatabaseSchema = { ...DEFAULT_DB };

// Load database from file
function loadDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      db = {
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        couponProfile: {
          ...DEFAULT_DB.couponProfile,
          ...(parsed.couponProfile || {}),
          shopName: 'Darjeeling momo',
          shopAddress: 'Itahari-6, Sky Plaza',
          shopPhone: '9802755605',
          holderName: parsed.couponProfile?.holderName && parsed.couponProfile.holderName !== 'Bipin Chhetri'
            ? parsed.couponProfile.holderName
            : 'Blue Fox',
        },
        adminPin: parsed.adminPin || '1234',
        lastUpdated: parsed.lastUpdated || Date.now(),
      };
      console.log(`[DB] Loaded ${db.transactions.length} transactions from disk.`);
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error('[DB] Failed to load database:', err);
    db = { ...DEFAULT_DB };
  }
}

// Save database to file
function saveDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastUpdated = Date.now();
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed to save database:', err);
  }
}

// Active Server-Sent Events (SSE) clients
const sseClients = new Set<Response>();

function broadcastUpdate(eventType: 'LEDGER_UPDATE' | 'INIT', extraData?: any): void {
  const payload = JSON.stringify({
    type: eventType,
    transactions: db.transactions,
    couponProfile: db.couponProfile,
    lastUpdated: db.lastUpdated,
    ...extraData,
  });

  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  loadDatabase();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      shop: 'Darjeeling momo',
      customer: 'Blue Fox',
      connectedClients: sseClients.size,
      time: Date.now(),
    });
  });

  // GET /api/ledger - Retrieve full ledger & profile
  app.get('/api/ledger', (_req: Request, res: Response) => {
    res.json({
      transactions: db.transactions,
      couponProfile: db.couponProfile,
      lastUpdated: db.lastUpdated,
    });
  });

  // POST /api/ledger/transaction - Add a new transaction with instant broadcast
  app.post('/api/ledger/transaction', (req: Request, res: Response) => {
    const newTx = req.body;
    if (!newTx || !newTx.id) {
      return res.status(400).json({ error: 'Invalid transaction payload' });
    }

    // Prepend new transaction
    db.transactions = [newTx, ...db.transactions.filter((t) => t.id !== newTx.id)];
    saveDatabase();
    broadcastUpdate('LEDGER_UPDATE', { newTransactionId: newTx.id });

    res.status(201).json({ success: true, transaction: newTx, total: db.transactions.length });
  });

  // POST /api/ledger/sync - Batch sync transactions
  app.post('/api/ledger/sync', (req: Request, res: Response) => {
    const { transactions, couponProfile } = req.body;
    if (Array.isArray(transactions)) {
      db.transactions = transactions;
    }
    if (couponProfile) {
      db.couponProfile = {
        ...db.couponProfile,
        ...couponProfile,
        shopName: 'Darjeeling momo',
        shopAddress: 'Itahari-6, Sky Plaza',
        shopPhone: '9802755605',
      };
    }
    saveDatabase();
    broadcastUpdate('LEDGER_UPDATE');

    res.json({ success: true, count: db.transactions.length });
  });

  // POST /api/ledger/clear - Clear all transactions
  app.post('/api/ledger/clear', (req: Request, res: Response) => {
    const { resetCoupon } = req.body || {};
    db.transactions = [];
    if (resetCoupon) {
      db.couponProfile = { ...DEFAULT_DB.couponProfile };
    }
    saveDatabase();
    broadcastUpdate('LEDGER_UPDATE', { cleared: true });

    res.json({ success: true, message: 'All database transactions cleared.' });
  });

  // PUT /api/coupon - Update coupon profile
  app.put('/api/coupon', (req: Request, res: Response) => {
    const updated = req.body;
    if (updated) {
      db.couponProfile = {
        ...db.couponProfile,
        ...updated,
        shopName: 'Darjeeling momo',
        shopAddress: 'Itahari-6, Sky Plaza',
        shopPhone: '9802755605',
      };
      saveDatabase();
      broadcastUpdate('LEDGER_UPDATE');
    }
    res.json({ success: true, couponProfile: db.couponProfile });
  });

  // Admin PIN verification
  app.post('/api/auth/verify-pin', (req: Request, res: Response) => {
    const { pin } = req.body || {};
    const isValid = String(pin || '').trim() === db.adminPin;
    res.json({ valid: isValid });
  });

  // Admin PIN change
  app.post('/api/auth/change-pin', (req: Request, res: Response) => {
    const { oldPin, newPin } = req.body || {};
    if (String(oldPin || '').trim() !== db.adminPin) {
      return res.status(401).json({ error: 'Incorrect current PIN' });
    }
    const cleanNewPin = String(newPin || '').trim();
    if (cleanNewPin.length !== 4 || !/^\d{4}$/.test(cleanNewPin)) {
      return res.status(400).json({ error: 'New PIN must be exactly 4 numeric digits' });
    }

    db.adminPin = cleanNewPin;
    saveDatabase();
    res.json({ success: true, message: 'Admin PIN successfully updated' });
  });

  // Server-Sent Events (SSE) Live Stream for Instant Synchronization
  app.get('/api/ledger/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Initial snapshot sent immediately upon connection
    const initPayload = JSON.stringify({
      type: 'INIT',
      transactions: db.transactions,
      couponProfile: db.couponProfile,
      lastUpdated: db.lastUpdated,
    });
    res.write(`data: ${initPayload}\n\n`);

    sseClients.add(res);

    // Keep connection alive with a 15-second heartbeat
    const keepAlive = setInterval(() => {
      res.write(':ping\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // Direct ZIP download endpoint
  app.get('/api/download-zip', (_req: Request, res: Response) => {
    const zipPath = path.resolve(__dirname, 'public', 'bluefox-khaja-khata-source.zip');
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="bluefox-khaja-khata-final.zip"');
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } else {
      res.status(404).send('ZIP file not found. Please regenerate.');
    }
  });

  // Vite Dev Server / Static Assets Handler
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Mount Vite dev middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Blue Fox Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
