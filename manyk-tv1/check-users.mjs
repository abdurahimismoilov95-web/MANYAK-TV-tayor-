// Database'dagi foydalanuvchilarni tekshirish
import { Users } from './database.js';

console.log('=== USERS TABLE ===');
const users = Users.getAll();
console.log(`Jami foydalanuvchilar: ${users.length}`);
console.log('');

if (users.length > 0) {
  users.slice(0, 10).forEach((user, i) => {
    console.log(`${i + 1}. User #${user.id}`);
    console.log(`   Ism: ${user.firstName || 'N/A'}`);
    console.log(`   Username: ${user.username || 'N/A'}`);
    console.log(`   VIP: ${user.isVip ? 'Ha' : 'Yo\'q'}`);
    console.log(`   Yaratilgan: ${user.createdAt}`);
    console.log('');
  });
} else {
  console.log('❌ Database bo\'sh! Hech qanday foydalanuvchi yo\'q.');
  console.log('');
  console.log('SABAB:');
  console.log('1. Bot hali hech kim tomonidan ishlatilmagan');
  console.log('2. Database fayli noto\'g\'ri joylashgan');
  console.log('3. Server restart bo\'lib, ma\'lumotlar yo\'qolgan (Volume kerak!)');
  console.log('');
  console.log('YECHIM:');
  console.log('- Botni Telegram\'da oching: @Animanyaktvuzbot');
  console.log('- /start buyrug\'ini yuboring');
  console.log('- Keyin qaytadan broadcast qiling');
}
