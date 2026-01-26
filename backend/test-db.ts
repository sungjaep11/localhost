import { prisma } from './lib/prisma';

async function checkDB() {
  try {
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 간단한 쿼리로 테이블 존재 확인
    try {
      const userCount = await prisma.user.count();
      console.log(`\n📊 데이터베이스 상태:`);
      console.log(`   ✅ User 테이블 존재 (${userCount}개 레코드)`);
      
      const roomCount = await prisma.room.count();
      console.log(`   ✅ Room 테이블 존재 (${roomCount}개 레코드)`);
      
      const itemCount = await prisma.item.count();
      console.log(`   ✅ Item 테이블 존재 (${itemCount}개 레코드)`);
      
      console.log(`\n🎉 데이터베이스가 정상적으로 구축되어 있습니다!`);
    } catch (error: any) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log(`\n⚠️  테이블이 존재하지 않습니다.`);
        console.log(`   → 마이그레이션을 실행해야 합니다.`);
        console.log(`   → 명령어: npx prisma migrate dev`);
      } else {
        throw error;
      }
    }
    
    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ 오류:', error.message);
    console.error('   코드:', error.code);
    process.exit(1);
  }
}

checkDB();
