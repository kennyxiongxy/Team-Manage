import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { exec, run, waitForDb } from '../src/utils/db';

function genId() {
  return uuidv4().replace(/-/g, '').substring(0, 32);
}

async function main() {
  await waitForDb();
  console.log('Cleaning seed data...');

  // 清理现有数据，不插入任何演示数据
  exec('DELETE FROM daily_reports');
  exec('DELETE FROM help_requests');
  exec('DELETE FROM tasks');
  exec('DELETE FROM projects');
  exec('DELETE FROM users');

  console.log('Database cleaned. No demo data seeded.');
}

main().catch(console.error);
