import 'dotenv/config';
import pg from 'pg';

async function checkMigrations() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://admin:1234@localhost:5432/localhost_db'
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공!\n');

    // 마이그레이션 테이블 확인
    const migrationCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      );
    `);
    
    if (migrationCheck.rows[0].exists) {
      const migrations = await client.query('SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5');
      console.log('📋 적용된 마이그레이션:');
      migrations.rows.forEach((row: any) => {
        console.log(`   - ${row.migration_name}`);
      });
    } else {
      console.log('⚠️  마이그레이션 테이블이 없습니다.');
    }

    // 모든 테이블 확인
    const tables = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log(`\n📊 데이터베이스 테이블 목록 (${tables.rows.length}개):`);
    if (tables.rows.length === 0) {
      console.log('   ⚠️  테이블이 없습니다. 마이그레이션이 필요합니다.');
    } else {
      tables.rows.forEach((row: any) => {
        console.log(`   ✅ ${row.tablename}`);
      });
    }

    await client.end();
  } catch (error: any) {
    console.error('❌ 오류:', error);
    console.error('메시지:', error.message);
    console.error('스택:', error.stack);
    if (client) await client.end().catch(() => {});
    process.exit(1);
  }
}

checkMigrations();
