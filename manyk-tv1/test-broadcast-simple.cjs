// Simple broadcast test - no photo, no button
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = '891846690';

async function testSimpleBroadcast() {
  const text = '🎬 <b>DYTDYUGD</b>\n\n📽 <b>Scarlet</b>\n⭐️ 7.5/10\n📅 2026\n🎭 SHORT_DRAMA\n\n✨ Hammaga ochiq';
  
  // NO BUTTON - just text
  const payload = {
    chat_id: CHAT_ID,
    text: text,
    parse_mode: 'HTML'
  };
  
  console.log('Yuborilmoqda...');
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Yuborildi!');
    } else {
      console.error('❌ Xato:', data.description);
    }
  } catch (err) {
    console.error('❌ Network:', err.message);
  }
}

testSimpleBroadcast();
