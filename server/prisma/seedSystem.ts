import { exec, run, waitForDb } from '../src/utils/db';
import systemData from './seedSystemData';

async function main() {
  await waitForDb();
  console.log('Seeding system data...');

  exec('DELETE FROM system_data');

  for (const [key, value] of Object.entries(systemData)) {
    run('INSERT INTO system_data (data_key, data_value) VALUES (?, ?)', [key, JSON.stringify(value)]);
  }

  console.log(`Seeded ${Object.keys(systemData).length} system data keys successfully!`);
}

main().catch(console.error);
