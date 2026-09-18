// Test broadcast script
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = '891846690';

async function testBroadcast() {
  console.log('Bot token:', BOT_TOKEN ? 'Mavjud' : 'YO\'Q!');
  
  const text = '🎬 <b>Test xabar</b>\n\nBu test xabari.\n\n✅ Agar bu xabarni ko\'rsangiz - bot ishlayapti!';
  
  const payload = {
    chat_id: CHAT_ID,
    text: text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: '🎬 Bot sahifasi', url: 'https://t.me/Animanyaktvuzbot' }
      ]]
    }
  };
  
  console.log('\nXabar yuborilmoqda...');
  console.log('Chat ID:', CHAT_ID);
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log('\n✅ MUVAFFAQIYATLI yuborildi!');
      console.log('Message ID:', data.result.message_id);
    } else {
      console.error('\n❌ XATO:', data.description);
      console.error('Full response:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('\n❌ Network xatosi:', err.message);
  }
}

testBroadcast();
