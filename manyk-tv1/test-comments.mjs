// Comments API'ni test qilish
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

async function testComments() {
  console.log('=== COMMENTS API TEST ===\n');
  
  try {
    // 1. Kommentlarni olish (public endpoint - auth kerak emas)
    console.log('1. Kommentlarni olish...');
    const getResponse = await fetch(`${API_BASE_URL}/comments/test-content-123`);
    const getData = await getResponse.json();
    console.log('   Status:', getResponse.status);
    console.log('   Response:', getData);
    console.log('');
    
    if (getResponse.ok) {
      console.log('✅ GET /api/comments/:contentId ishlayapti!');
      console.log(`   Jami kommentlar: ${getData.comments?.length || 0}`);
    } else {
      console.log('❌ GET /api/comments/:contentId ishlamayapti!');
    }
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  }
  
  console.log('\n=== TEST YAKUNLANDI ===');
  console.log('\n📝 ESLATMA:');
  console.log('POST /api/comments uchun auth token kerak.');
  console.log('Shorts\'da komment yozsangiz, browser console\'da ko\'rasiz.');
}

testComments();
