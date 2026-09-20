/**
 * Automatic Route Handler Async Conversion Script
 * ================================================
 * Converts all server.js route handlers to async/await
 */

import fs from 'fs';

const serverFile = './server.js';
let content = fs.readFileSync(serverFile, 'utf8');

// Database functions that need await
const asyncFunctions = [
  'Users\\.getAll', 'Users\\.getById', 'Users\\.upsert', 'Users\\.grantVip',
  'Users\\.revokeVip', 'Users\\.ban', 'Users\\.unban', 'Users\\.resetHwid',
  'Users\\.syncTelegramProfile', 'Users\\.verifyByContact', 'Users\\.count',
  'Users\\.vipCount', 'Users\\.expireSubscriptions',
  
  'Receipts\\.getAll', 'Receipts\\.getByStatus', 'Receipts\\.getById',
  'Receipts\\.getByUserId', 'Receipts\\.submit', 'Receipts\\.review',
  'Receipts\\.pendingCount', 'Receipts\\.totalRevenue',
  
  'Contents\\.getAll', 'Contents\\.getById', 'Contents\\.upsert',
  'Contents\\.delete', 'Contents\\.count', 'Contents\\.bulkInsert',
  
  'Plans\\.getAll', 'Plans\\.getById', 'Plans\\.upsert',
  'Plans\\.delete', 'Plans\\.bulkInsert',
  
  'PromoCodes\\.validate', 'PromoCodes\\.consume', 'PromoCodes\\.getAll',
  'PromoCodes\\.create', 'PromoCodes\\.delete',
  
  'WatchHistory\\.getByUserId', 'WatchHistory\\.upsert', 'WatchHistory\\.clearByUserId',
  'WatchHistory\\.getByUser', 'WatchHistory\\.add', 'WatchHistory\\.clear',
  
  'Favorites\\.getByUserId', 'Favorites\\.add', 'Favorites\\.remove',
  'Favorites\\.toggle', 'Favorites\\.getByUser',
  
  'Settings\\.get', 'Settings\\.set', 'Settings\\.update',
  
  'AppointedAdmins\\.getAll', 'AppointedAdmins\\.getById',
  'AppointedAdmins\\.upsert', 'AppointedAdmins\\.remove',
  
  'AuditLogs\\.log', 'AuditLogs\\.getRecent', 'AuditLogs\\.getByAdmin',
  'AuditLogs\\.add',
  
  'VerificationCodes\\.create', 'VerificationCodes\\.getByCode',
  'VerificationCodes\\.updateStatus', 'VerificationCodes\\.cleanup',
  'VerificationCodes\\.markVerified', 'VerificationCodes\\.markClaimed',
  'VerificationCodes\\.attachChat', 'VerificationCodes\\.findAwaitingByChat',
  
  'BannedDevices\\.isBanned', 'BannedDevices\\.ban', 'BannedDevices\\.unban',
  
  'Comments\\.getByContentId', 'Comments\\.add', 'Comments\\.delete',
  
  'Admins\\.getAll', 'Admins\\.upsert', 'Admins\\.remove',
  'Admins\\.ensureEnvAdmin',
  
  'DailyCheckIn\\.getStatus', 'DailyCheckIn\\.claim',
  
  'TokenUnlock\\.record',
  
  'Stats\\.dashboard',
];

console.log('🔄 Converting route handlers to async...\n');

// Step 1: Convert route declarations to async
let changes = 0;

// Pattern: app.METHOD('/path', middleware, (req, res) => {
const routePattern = /(app\.(get|post|put|delete|patch)\([^,]+,\s*(?:[^,]+,\s*)*)\(req,\s*res\)\s*=>\s*\{/g;

content = content.replace(routePattern, (match, prefix, method) => {
  changes++;
  return `${prefix}async (req, res) => {`;
});

console.log(`✅ Step 1: Converted ${changes} route handlers to async\n`);

// Step 2: Add await before database calls
let awaitChanges = 0;

asyncFunctions.forEach(funcPattern => {
  const regex = new RegExp(`(?<!await\\s+)(${funcPattern}\\([^)]*\\))`, 'g');
  
  content = content.replace(regex, (match, call) => {
    // Don't add await if it's already there
    const beforeMatch = content.substring(Math.max(0, content.indexOf(match) - 10), content.indexOf(match));
    if (beforeMatch.includes('await')) return match;
    
    awaitChanges++;
    return `await ${call}`;
  });
});

console.log(`✅ Step 2: Added ${awaitChanges} await keywords\n`);

// Step 3: Fix specific patterns

// Pattern: res.json({ ok: true, data: SyncFunction() })
const inlinePattern = /res\.json\(\{([^}]+)(Users|Receipts|Contents|Plans|PromoCodes|Settings|Admins|Stats)\.(\w+)\([^)]*\)([^}]*)\}\)/g;

let inlineChanges = 0;
content = content.replace(inlinePattern, (match) => {
  // Extract the function call
  const funcMatch = match.match(/(Users|Receipts|Contents|Plans|PromoCodes|Settings|Admins|Stats)\.(\w+)\([^)]*\)/);
  if (funcMatch) {
    const [fullCall] = funcMatch;
    
    // Check if await is already there
    if (match.includes(`await ${fullCall}`)) return match;
    
    inlineChanges++;
    return match.replace(fullCall, `await ${fullCall}`);
  }
  return match;
});

console.log(`✅ Step 3: Fixed ${inlineChanges} inline database calls\n`);

// Step 4: Handle assignment patterns
// const data = Model.method()
const assignPattern = /(const|let|var)\s+(\w+)\s*=\s*(Users|Receipts|Contents|Plans|PromoCodes|WatchHistory|Favorites|Settings|AppointedAdmins|AuditLogs|VerificationCodes|BannedDevices|Comments|Admins|DailyCheckIn|TokenUnlock|Stats)\.(\w+)\(/g;

let assignChanges = 0;
content = content.replace(assignPattern, (match, varType, varName, model, method) => {
  // Check if await is already there
  if (match.includes('await')) return match;
  
  assignChanges++;
  return `${varType} ${varName} = await ${model}.${method}(`;
});

console.log(`✅ Step 4: Fixed ${assignChanges} assignment patterns\n`);

// Write back
fs.writeFileSync(serverFile, content, 'utf8');

console.log('═══════════════════════════════════════════════════════');
console.log('🎉 CONVERSION COMPLETE!');
console.log('═══════════════════════════════════════════════════════');
console.log(`Total route handlers converted: ${changes}`);
console.log(`Total await keywords added: ${awaitChanges + inlineChanges + assignChanges}`);
console.log('\n⚠️  MANUAL REVIEW REQUIRED:');
console.log('1. Check for any missed patterns');
console.log('2. Test all endpoints');
console.log('3. Fix any logic errors');
console.log('4. Run: npm run server');
console.log('═══════════════════════════════════════════════════════\n');
