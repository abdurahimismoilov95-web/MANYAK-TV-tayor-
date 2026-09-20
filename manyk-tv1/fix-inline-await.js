/**
 * Fix Inline Await in Arrow Functions
 * ====================================
 * Converts: (req, res) => res.json({ await ... })
 * To: async (req, res) => { const data = await ...; res.json({ data }); }
 */

import fs from 'fs';

const serverFile = './server.js';
let content = fs.readFileSync(serverFile, 'utf8');

let changes = 0;

console.log('🔄 Fixing inline await in arrow functions...\n');

// Pattern 1: app.get('/path', (req, res) => res.json({ ok: true, data: await Model.method() }));
const inlinePattern = /(app\.(get|post)\([^,]+,(?:\s*\w+,)*)\s*\(req,\s*res\)\s*=>\s*res\.json\(\{\s*ok:\s*true,\s*(\w+):\s*await\s+([^}]+)\}\)\);/g;

content = content.replace(inlinePattern, (match, prefix, method, varName, awaitCall) => {
  changes++;
  return `${prefix} async (req, res) => {
  const ${varName} = await ${awaitCall.trim()};
  res.json({ ok: true, ${varName} });
});`;
});

// Pattern 2: (req, res) => { await Something(); res.json(...); }
const blockPattern = /(app\.(get|post|put|delete)\([^,]+,(?:\s*\w+,)*)\s*\(req,\s*res\)\s*=>\s*\{\s*(await\s+[^;]+;\s*res\.json[^}]+)\}\);/g;

content = content.replace(blockPattern, (match, prefix, method, body) => {
  changes++;
  return `${prefix} async (req, res) => { ${body} });`;
});

// Write back
fs.writeFileSync(serverFile, content, 'utf8');

console.log('═══════════════════════════════════════════════════════');
console.log('🎉 INLINE AWAIT FIX COMPLETE!');
console.log('═══════════════════════════════════════════════════════');
console.log(`Total fixes applied: ${changes}`);
console.log('═══════════════════════════════════════════════════════\n');
