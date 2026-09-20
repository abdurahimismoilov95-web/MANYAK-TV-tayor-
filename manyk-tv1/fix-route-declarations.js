/**
 * Fix Route Handler Declarations - Add async keyword
 * ===================================================
 */

import fs from 'fs';

const serverFile = './server.js';
let content = fs.readFileSync(serverFile, 'utf8');

let changes = 0;

// More specific patterns for route handlers
const patterns = [
  // app.get('/path', (req, res) => {
  /app\.(get|post|put|delete|patch)\([^,]+,\s*\(req,\s*res\)\s*=>\s*\{/g,
  
  // app.get('/path', middleware, (req, res) => {
  /app\.(get|post|put|delete|patch)\([^,]+,\s*\w+,\s*\(req,\s*res\)\s*=>\s*\{/g,
  
  // app.get('/path', middleware1, middleware2, (req, res) => {
  /app\.(get|post|put|delete|patch)\([^,]+,\s*\w+,\s*\w+,\s*\(req,\s*res\)\s*=>\s*\{/g,
  
  // app.get('/path', middleware1, middleware2, middleware3, (req, res) => {
  /app\.(get|post|put|delete|patch)\([^,]+,\s*\w+,\s*\w+,\s*\w+,\s*\(req,\s*res\)\s*=>\s*\{/g,
];

console.log('🔄 Adding async keyword to route handlers...\n');

patterns.forEach((pattern, index) => {
  content = content.replace(pattern, (match) => {
    // Check if already async
    if (match.includes('async')) return match;
    
    // Add async before (req, res)
    const replaced = match.replace('(req, res)', 'async (req, res)');
    
    if (replaced !== match) {
      changes++;
      return replaced;
    }
    
    return match;
  });
  
  console.log(`Pattern ${index + 1}: Processed`);
});

// Write back
fs.writeFileSync(serverFile, content, 'utf8');

console.log('\n═══════════════════════════════════════════════════════');
console.log('🎉 ASYNC KEYWORD ADDITION COMPLETE!');
console.log('═══════════════════════════════════════════════════════');
console.log(`Total route handlers made async: ${changes}`);
console.log('═══════════════════════════════════════════════════════\n');
