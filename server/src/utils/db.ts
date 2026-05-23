import initSqlJs from 'sql.js';
import type { SqlJsStatic, Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_URL?.replace('sqlite:', '') || path.resolve(__dirname, '../../data.db');

let db: SqlJsDatabase;
let SQL: SqlJsStatic;

async function init() {
  SQL = await initSqlJs();
  try {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } catch {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');
}

// Initialize immediately
const initPromise = init();

function ensureDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export async function waitForDb() {
  await initPromise;
}

export function queryAll<T = any>(sql: string, params?: any[]): T[] {
  const d = ensureDb();
  const stmt = d.prepare(sql);
  if (params) stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(sql: string, params?: any[]): T | undefined {
  const d = ensureDb();
  const stmt = d.prepare(sql);
  if (params) stmt.bind(params);
  let result: T | undefined;
  if (stmt.step()) {
    result = stmt.getAsObject() as T;
  }
  stmt.free();
  return result;
}

export function run(sql: string, params?: any[]): { lastInsertRowid: number; changes: number } {
  const d = ensureDb();
  if (params) {
    d.run(sql, params);
  } else {
    d.run(sql);
  }
  // Save to disk after each write
  const data = d.export();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, Buffer.from(data));
  // Get actual last insert rowid
  const stmt = d.prepare('SELECT last_insert_rowid() as id');
  let lastId = 0;
  if (stmt.step()) {
    lastId = (stmt.getAsObject() as any).id as number;
  }
  stmt.free();
  return { lastInsertRowid: lastId, changes: d.getRowsModified() };
}

export function transaction<T>(callback: () => T): T {
  const d = ensureDb();
  d.run('BEGIN');
  try {
    const result = callback();
    d.run('COMMIT');
    const data = d.export();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, Buffer.from(data));
    return result;
  } catch (error) {
    d.run('ROLLBACK');
    throw error;
  }
}

export function exec(sql: string) {
  const d = ensureDb();
  d.exec(sql);
  const data = d.export();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, Buffer.from(data));
}
