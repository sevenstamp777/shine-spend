// Sincronização dos dados entre dispositivos (celular ↔ desktop)
// Endpoint: GET  /api/sync?token=...  → retorna o snapshot armazenado
//           PUT  /api/sync           → grava o snapshot (header x-sync-token)
import { neon } from '@neondatabase/serverless';
import type { IncomingMessage, ServerResponse } from 'http';

const sql = neon(process.env.DATABASE_URL!);

type Req = IncomingMessage & { query?: Record<string, string | string[]>; body?: unknown };
type Res = ServerResponse & {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => Res;
  end: (body?: unknown) => Res;
};

function readBody(req: Req): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function getToken(req: Req): string {
  const header = (req.headers['x-sync-token'] as string) || '';
  const query = (req.query?.token as string) || '';
  return (header || query || '').trim();
}

export default async function handler(req: Req, res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-sync-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: 'token ausente' });
  }
  if (process.env.SYNC_TOKEN && token !== process.env.SYNC_TOKEN) {
    return res.status(403).json({ error: 'token inválido' });
  }

  try {
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT data, updated_at
        FROM sync_snapshots
        WHERE token = ${token}
      `;
      if (rows.length === 0) {
        return res.status(200).json({ data: null });
      }
      const row = rows[0] as { data: unknown; updated_at: string };
      return res.status(200).json({ data: row.data, updatedAt: row.updated_at });
    }

    if (req.method === 'PUT') {
      const body = (await readBody(req)) as { data?: unknown };
      const data = body?.data;
      if (data === undefined || data === null) {
        return res.status(400).json({ error: 'campo data ausente' });
      }
      await sql`
        INSERT INTO sync_snapshots (token, data, updated_at)
        VALUES (${token}, ${JSON.stringify(data)}::jsonb, now())
        ON CONFLICT (token)
        DO UPDATE SET data = EXCLUDED.data, updated_at = now()
      `;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'método não permitido' });
  } catch (err) {
    console.error('sync error:', err);
    return res.status(500).json({ error: 'erro interno' });
  }
}
