import { prisma } from './lib/prisma';
import { songs } from './seed-songs-data';

// 노래가 게임에서 "들리게" 하려면 youtubeUrl에 watch?v=영상ID 형식이어야 합니다.
// seed-songs-data.ts를 getsongs로 갱신하면 YouTube API로 watch 링크를 채웁니다.

async function main() {
  console.log('노래 데이터를 데이터베이스에 저장하는 중...');

  // 기존 노래 데이터 삭제 (선택사항)
  await prisma.song.deleteMany({});
  console.log('기존 노래 데이터 삭제 완료');

  // 노래 데이터 저장
  for (const song of songs) {
    await prisma.song.create({
      data: song,
    });
  }

  console.log(`${songs.length}개의 노래가 성공적으로 저장되었습니다.`);
  
  // 장르별 노래 개수 확인
  const genreCounts = await prisma.song.groupBy({
    by: ['genre'],
    _count: {
      genre: true,
    },
  });
  
  console.log('\n장르별 노래 개수:');
  for (const item of genreCounts) {
    console.log(`  ${item.genre}: ${item._count.genre}개`);
  }
}

main()
  .catch((e) => {
    console.error('에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
