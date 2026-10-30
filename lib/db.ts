import 'server-only';
import mysql from 'mysql2/promise';

// One shared connection pool. Details come from Hostinger environment variables.
const g = globalThis as unknown as { __tbossPool?: mysql.Pool; __tbossReady?: Promise<void> };

function pool() {
  if (!g.__tbossPool) {
    if (!process.env.DB_NAME) throw new Error('Database not configured: add DB_HOST, DB_NAME, DB_USER and DB_PASSWORD in Hostinger.');
    g.__tbossPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
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
