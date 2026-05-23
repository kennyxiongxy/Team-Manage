import { exec, run, waitForDb } from '../src/utils/db';

async function main() {
  await waitForDb();
  console.log('Running migrations...');

  // Add owner_id to projects if not exists
  try {
    exec(`ALTER TABLE projects ADD COLUMN owner_id TEXT`);
    console.log('Added owner_id to projects');
  } catch (e: any) {
    if (e.message?.includes('duplicate column')) {
      console.log('owner_id already exists');
    } else {
      console.log('Skipping owner_id migration (may already exist)');
    }
  }

  // Add phone to users if not exists
  try {
    exec(`ALTER TABLE users ADD COLUMN phone TEXT`);
    console.log('Added phone to users');
  } catch (e: any) {
    if (e.message?.includes('duplicate column')) {
      console.log('phone already exists');
    } else {
      console.log('Skipping phone migration (may already exist)');
    }
  }

  console.log('Migrations complete.');
}

main().catch(console.error);
