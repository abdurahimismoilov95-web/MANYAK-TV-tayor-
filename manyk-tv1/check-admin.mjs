import { Admins, db, SUPER_ADMIN_ID } from './database.js';

console.log('=== CHECKING ADMIN STATUS ===\n');

const ENV_ADMIN_IDS = String(process.env.ADMIN_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

console.log('SUPER_ADMIN_ID:', SUPER_ADMIN_ID);
console.log('ENV_ADMIN_IDS:', ENV_ADMIN_IDS);
console.log('');

console.log('=== appointed_admins table ===');
const admins = db.prepare('SELECT * FROM appointed_admins').all();
console.log('Total admins:', admins.length);
admins.forEach(a => {
  console.log(`  ID: ${a.id}, Name: ${a.name}, Super: ${a.is_super_admin}`);
});
console.log('');

console.log('=== Checking user 891846690 ===');
const userId = '891846690';
const isAdmin = await Admins.isAdmin(userId);

console.log('Admins.isAdmin("891846690"):', isAdmin);
console.log('');

if (!isAdmin) {
  console.log('❌ USER IS NOT ADMIN!');
  console.log('');
  console.log('Debugging:');
  console.log('  SUPER_ADMIN_ID === userId:', SUPER_ADMIN_ID === userId);
  console.log('  ENV_ADMIN_IDS.includes(userId):', ENV_ADMIN_IDS.includes(userId));
  const inTable = Boolean(db.prepare('SELECT 1 FROM appointed_admins WHERE id = ?').get(userId));
  console.log('  In appointed_admins table:', inTable);
} else {
  console.log('✅ USER IS ADMIN!');
}

db.close();
