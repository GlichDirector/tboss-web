import 'server-only';
import mysql from 'mysql2/promise';

// One shared connection pool. Details come from Hostinger environment variables.
const g = globalThis as unknown as { __tbossPool?: mysql.Pool; __tbossReady?: Promise<void> };

function pool() {
  if (!g.__tbossPool) {
    if (!process.env.DB_NAME) throw new Error('Database not configured: add DB_HOST, DB_NAME, DB_USER and DB_PASSWORD in Hostinger.');
    g.__tbossPool = mysql.createPool({
      // Node can read 'localhost' as the IPv6 address, which Hostinger's MySQL may not listen on.
      host: !process.env.DB_HOST || process.env.DB_HOST === 'localhost' ? '127.0.0.1' : process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 5,
      charset: 'utf8mb4',
      dateStrings: true,
      timezone: 'Z',
    });
  }
  return g.__tbossPool;
}

// Tables are created automatically the first time the app talks to the database.
// New columns or tables in later phases are added to this list the same way.
const schema = [
  `CREATE TABLE IF NOT EXISTS galleries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(80) NOT NULL UNIQUE,
    access_key VARCHAR(40) NOT NULL,
    title VARCHAR(200) NOT NULL,
    client_name VARCHAR(160) NOT NULL,
    client_emails TEXT NOT NULL,
    session_date DATE NULL,
    location VARCHAR(200) NULL,
    stage ENUM('draft','selection','finished') NOT NULL DEFAULT 'draft',
    cover_photo_id INT NULL,
    selection_limit INT NOT NULL DEFAULT 0,
    extra_price VARCHAR(40) NULL,
    choose_by DATE NULL,
    expires_on DATE NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gallery_id INT NOT NULL,
    folder ENUM('unedited','edited') NOT NULL,
    filename VARCHAR(255) NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    width INT NOT NULL DEFAULT 0,
    height INT NOT NULL DEFAULT 0,
    bytes BIGINT NOT NULL DEFAULT 0,
    ready TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_name (gallery_id, folder, filename),
    KEY by_gallery (gallery_id, folder, sort_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS favourites (
    gallery_id INT NOT NULL,
    photo_id INT NOT NULL,
    email VARCHAR(200) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (photo_id, email),
    KEY by_gallery (gallery_id, email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gallery_id INT NOT NULL,
    email VARCHAR(200) NOT NULL,
    photo_ids TEXT NOT NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY by_gallery (gallery_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS downloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gallery_id INT NOT NULL,
    photo_id INT NOT NULL,
    email VARCHAR(200) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY by_gallery (gallery_id),
    KEY by_photo (photo_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

async function ready() {
  if (!g.__tbossReady) {
    g.__tbossReady = (async () => {
      const p = pool();
      for (const sql of schema) await p.query(sql);
    })().catch((e) => {
      g.__tbossReady = undefined;
      throw e;
    });
  }
  return g.__tbossReady;
}

export async function q<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ready();
  const [rows] = await pool().query(sql, params);
  return rows as T[];
}

export async function exec(sql: string, params: unknown[] = []) {
  await ready();
  const [res] = await pool().execute(sql, params as (string | number | null)[]);
  return res as mysql.ResultSetHeader;
}

export const dbConfigured = () => Boolean(process.env.DB_NAME);

// Plain-language check used by the studio admin to explain connection problems.
export async function dbHealth(): Promise<{ ok: true } | { ok: false; code: string; advice: string }> {
  if (!process.env.DB_NAME) return { ok: false, code: 'NOT_SET', advice: 'DB_NAME is missing. Add DB_HOST, DB_NAME, DB_USER and DB_PASSWORD in Hostinger → Environment variables, then Redeploy.' };
  try {
    await q('SELECT 1');
    return { ok: true };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    const code = err.code || 'UNKNOWN';
    const advice: Record<string, string> = {
      ER_ACCESS_DENIED_ERROR: 'The database username or password doesn’t match. In hPanel → Databases, check the full username (it starts with u…_) and reset the password if unsure, then update DB_USER and DB_PASSWORD and Redeploy.',
      ER_DBACCESS_DENIED_ERROR: 'This database user isn’t allowed into this database. In hPanel → Databases, make sure the user is linked to the database.',
      ER_BAD_DB_ERROR: 'No database with that name. Check DB_NAME: copy the full name from hPanel → Databases, including the u…_ prefix.',
      ECONNREFUSED: 'Nothing answered at DB_HOST. Try DB_HOST = 127.0.0.1, or the MySQL host name shown in hPanel → Databases.',
      ENOTFOUND: 'The DB_HOST address doesn’t exist. Copy the MySQL host from hPanel → Databases, or use localhost.',
      ETIMEDOUT: 'The database didn’t answer in time. Check DB_HOST in hPanel → Databases.',
      ER_NOT_SUPPORTED_AUTH_MODE: 'The database asked for a sign-in method this app doesn’t support. Tell Claude this code.',
    };
    return { ok: false, code, advice: advice[code] || `Unexpected database error: ${(err.message || '').slice(0, 200)}` };
  }
}
