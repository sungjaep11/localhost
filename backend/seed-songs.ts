import { prisma } from './lib/prisma';

const songs = [
  // 발라드
  { genre: '발라드', title: '너의 모든 순간', artist: '성시경', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%84%88%EC%9D%98+%EB%AA%A8%EB%93%A0+%EC%88%9C%EA%B0%84+%EC%84%B1%EC%8B%9C%EA%B2%BD' },
  { genre: '발라드', title: '눈의 꽃', artist: '박효신', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%88%88%EC%9D%98+%EA%BD%83+%EB%B0%95%ED%9A%A8%EC%8B%A0' },
  { genre: '발라드', title: '아로하', artist: '조정석', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%95%84%EB%A1%9C%ED%95%98+%EC%A1%B0%EC%A0%95%EC%84%9D' },
  { genre: '발라드', title: '보고싶다', artist: '김범수', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%B3%B4%EA%B3%A0%EC%8B%B6%EB%8B%A4+%EA%B9%80%EB%B2%94%EC%88%98' },
  { genre: '발라드', title: '사랑했지만', artist: '김광석', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%82%AC%EB%9E%91%ED%96%88%EC%A7%80%EB%A7%8C+%EA%B9%80%EA%B4%91%EC%84%9D' },
  { genre: '발라드', title: '그대라는 사치', artist: '한동근', youtubeUrl: 'https://www.youtube.com/results?search_query=%EA%B7%B8%EB%8C%80%EB%9D%BC%EB%8A%94+%EC%82%AC%EC%B9%98+%ED%95%9C%EB%8F%99%EA%B7%BC' },
  { genre: '발라드', title: '이 소설의 끝을 다시 써보려 해', artist: '한동근', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%9D%B4+%EC%86%8C%EC%84%A4%EC%9D%98+%EB%81%9D%EC%9D%84+%EB%8B%A4%EC%8B%9C+%EC%8D%A8%EB%B3%B4%EB%A0%A4+%ED%95%B4+%ED%95%9C%EB%8F%99%EA%B7%BC' },
  { genre: '발라드', title: '너를 만나', artist: '폴킴', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%84%88%EB%A5%BC+%EB%A7%8C%EB%82%98+%ED%8F%B4%ED%82%B4' },
  { genre: '발라드', title: '좋니', artist: '윤종신', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%A2%8B%EB%8B%88+%EC%9C%A4%EC%A2%85%EC%8B%A0' },
  { genre: '발라드', title: 'All For You', artist: '서인국, 정은지', youtubeUrl: 'https://www.youtube.com/results?search_query=All+For+You+%EC%84%9C%EC%9D%B8%EA%B5%AD+%EC%A0%95%EC%9D%80%EC%A7%80' },

  // K-pop
  { genre: 'K-pop', title: '다이너마이트', artist: 'BTS', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%8B%A4%EC%9D%B4%EB%84%88%EB%A7%88%EC%9D%B4%ED%8A%B8+BTS' },
  { genre: 'K-pop', title: '버터', artist: 'BTS', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%B2%84%ED%84%B0+BTS' },
  { genre: 'K-pop', title: '강남스타일', artist: 'PSY', youtubeUrl: 'https://www.youtube.com/results?search_query=%EA%B0%95%EB%82%A8%EC%8A%A4%ED%83%80%EC%9D%BC+PSY' },
  { genre: 'K-pop', title: '지', artist: '소녀시대', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%A7%80+%EC%86%8C%EB%85%80%EC%8B%9C%EB%8C%80' },
  { genre: 'K-pop', title: '치어 업', artist: 'TWICE', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%B9%98%EC%96%B4%EC%97%85+TWICE' },
  { genre: 'K-pop', title: '티티', artist: 'TWICE', youtubeUrl: 'https://www.youtube.com/results?search_query=%ED%8B%B0%ED%8B%B0+TWICE' },
  { genre: 'K-pop', title: '사랑을 했다', artist: 'iKON', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%82%AC%EB%9E%91%EC%9D%84+%ED%96%88%EB%8B%A4+iKON' },
  { genre: 'K-pop', title: '하입보이', artist: 'NewJeans', youtubeUrl: 'https://www.youtube.com/results?search_query=%ED%95%98%EC%9E%85%EB%B3%B4%EC%9D%B4+NewJeans' },
  { genre: 'K-pop', title: '러브 다이브', artist: 'IVE', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%9F%AC%EB%B8%8C%EB%8B%A4%EC%9D%B4%EB%B8%8C+IVE' },
  { genre: 'K-pop', title: '넥스트 레벨', artist: 'aespa', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%84%A5%EC%8A%A4%ED%8A%B8+%EB%A0%88%EB%B2%A8+aespa' },

  // J-pop (영어 제외 → 한글 제목)
  { genre: 'J-pop', title: '레몬', artist: '요네즈 켄시', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%A0%88%EB%AA%AC+%EC%9A%94%EB%84%A4%EC%A6%88+%EC%BC%84%EC%8B%9C' },
  { genre: 'J-pop', title: '프리텐더', artist: 'Official髭男dism', youtubeUrl: 'https://www.youtube.com/results?search_query=%ED%94%84%EB%A6%AC%ED%85%90%EB%8D%94+Official+HIGE+DANDism' },
  { genre: 'J-pop', title: '마루노우치 새디스틱', artist: '시이나 링고', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%A7%88%EB%A3%A8%EB%85%B8%EC%9A%B0%EC%B9%98+%EC%83%88%EB%94%94%EC%8A%A4%ED%8B%B1+%EC%8B%9C%EC%9D%B4%EB%82%98+%EB%A7%81%EA%B3%A0' },
  { genre: 'J-pop', title: '밤을 달리다', artist: 'YOASOBI', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%B0%A4%EC%9D%84+%EB%8B%AC%EB%A6%AC%EB%8B%A4+YOASOBI' },
  { genre: 'J-pop', title: '홍련화', artist: 'LiSA', youtubeUrl: 'https://www.youtube.com/results?search_query=%ED%99%8D%EB%A0%A8%ED%99%94+LiSA' },
  { genre: 'J-pop', title: '잔혹한 천사의 테제', artist: '다카하시 요코', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%9E%94%ED%98%B9%ED%95%9C+%EC%B2%9C%EC%82%AC%EC%9D%98+%ED%85%8C%EC%A0%9C' },
  { genre: 'J-pop', title: '작은 사랑의 노래', artist: 'MONGOL800', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%9E%91%EC%9D%80+%EC%82%AC%EB%9E%91%EC%9D%98+%EB%85%B8%EB%9E%98+MONGOL800' },
  { genre: 'J-pop', title: '바람이 불고 있다', artist: '이키모노가카리', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%B0%94%EB%9E%8C%EC%9D%B4+%EB%B6%88%EA%B3%A0+%EC%9E%88%EB%8B%A4+%EC%9D%B4%ED%82%A4%EB%AA%A8%EB%85%B8%EA%B0%80%EC%B9%B4%EB%A6%AC' },
  { genre: 'J-pop', title: '타상화화', artist: 'DAOKO × 요네즈 켄시', youtubeUrl: 'https://www.youtube.com/results?search_query=%ED%83%80%EC%83%81%ED%99%94%ED%99%94+DAOKO+%EC%9A%94%EB%84%A4%EC%A6%88+%EC%BC%84%EC%8B%9C' },
  { genre: 'J-pop', title: '세상에 하나뿐인 꽃', artist: 'SMAP', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%84%B8%EC%83%81%EC%97%90+%ED%95%98%EB%82%98%EB%BF%90%EC%9D%B8+%EA%BD%83+SMAP' },

  // 팝송
  { genre: '팝송', title: 'Shape of You', artist: 'Ed Sheeran', youtubeUrl: 'https://www.youtube.com/results?search_query=Shape+of+You+Ed+Sheeran' },
  { genre: '팝송', title: 'Blinding Lights', artist: 'The Weeknd', youtubeUrl: 'https://www.youtube.com/results?search_query=Blinding+Lights+The+Weeknd' },
  { genre: '팝송', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', youtubeUrl: 'https://www.youtube.com/results?search_query=Uptown+Funk+Mark+Ronson+Bruno+Mars' },
  { genre: '팝송', title: 'Someone Like You', artist: 'Adele', youtubeUrl: 'https://www.youtube.com/results?search_query=Someone+Like+You+Adele' },
  { genre: '팝송', title: 'Rolling in the Deep', artist: 'Adele', youtubeUrl: 'https://www.youtube.com/results?search_query=Rolling+in+the+Deep+Adele' },
  { genre: '팝송', title: 'Bad Guy', artist: 'Billie Eilish', youtubeUrl: 'https://www.youtube.com/results?search_query=bad+guy+Billie+Eilish' },
  { genre: '팝송', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', youtubeUrl: 'https://www.youtube.com/results?search_query=Despacito+Luis+Fonsi+Daddy+Yankee' },
  { genre: '팝송', title: 'See You Again', artist: 'Wiz Khalifa ft. Charlie Puth', youtubeUrl: 'https://www.youtube.com/results?search_query=See+You+Again+Wiz+Khalifa+Charlie+Puth' },
  { genre: '팝송', title: 'Thinking Out Loud', artist: 'Ed Sheeran', youtubeUrl: 'https://www.youtube.com/results?search_query=Thinking+Out+Loud+Ed+Sheeran' },
  { genre: '팝송', title: 'Viva La Vida', artist: 'Coldplay', youtubeUrl: 'https://www.youtube.com/results?search_query=Viva+La+Vida+Coldplay' },

  // 댄스 (한국)
  { genre: '댄스', title: '아주 나이스', artist: '세븐틴', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%95%84%EC%A3%BC+%EB%82%98%EC%9D%B4%EC%8A%A4+%EC%84%B8%EB%B8%90%ED%8B%B4' },
  { genre: '댄스', title: '삐딱하게', artist: '지드래곤', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%82%90%EB%94%B1%ED%95%98%EA%B2%8C+%EC%A7%80%EB%93%9C%EB%9E%98%EA%B3%A4' },
  { genre: '댄스', title: '붐바야', artist: 'BLACKPINK', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%B6%90%EB%B0%94%EC%95%BC+BLACKPINK' },
  { genre: '댄스', title: '롤린', artist: '브레이브걸스', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%A1%A4%EB%A6%B0+%EB%B8%8C%EB%A0%88%EC%9D%B4%EB%B8%8C%EA%B1%B8%EC%8A%A4' },
  { genre: '댄스', title: '강남스타일', artist: 'PSY', youtubeUrl: 'https://www.youtube.com/results?search_query=%EA%B0%95%EB%82%A8%EC%8A%A4%ED%83%80%EC%9D%BC+PSY' },

  // 인디
  { genre: '인디', title: '봄날', artist: '아이유', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%B4%84%EB%82%A0+%EC%95%84%EC%9D%B4%EC%9C%A0' },
  { genre: '인디', title: '위잉위잉', artist: '혁오', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%9C%84%EC%9E%89%EC%9C%84%EC%9E%89+%ED%98%81%EC%98%A4' },
  { genre: '인디', title: 'Tomboy', artist: '혁오', youtubeUrl: 'https://www.youtube.com/results?search_query=Tomboy+%ED%98%81%EC%98%A4' },
  { genre: '인디', title: '사랑은 은하수 다방에서', artist: '10cm', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%82%AC%EB%9E%91%EC%9D%80+%EC%9D%80%ED%95%98%EC%88%98+%EB%8B%A4%EB%B0%A9%EC%97%90%EC%84%9C+10cm' },
  { genre: '인디', title: '너에게 난, 나에게 넌', artist: '자전거 탄 풍경', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%84%88%EC%97%90%EA%B2%8C+%EB%82%9C+%EB%82%98%EC%97%90%EA%B2%8C+%EB%84%8C+%EC%9E%90%EC%A0%84%EA%B1%B0+%ED%83%84+%ED%92%8D%EA%B2%BD' },
  { genre: '인디', title: '고백', artist: '뜨거운 감자', youtubeUrl: 'https://www.youtube.com/results?search_query=%EA%B3%A0%EB%B0%B1+%EB%9C%A8%EA%B1%B0%EC%9A%B4+%EA%B0%90%EC%9E%90' },
  { genre: '인디', title: 'D (Half Moon)', artist: 'DEAN', youtubeUrl: 'https://www.youtube.com/results?search_query=D+Half+Moon+DEAN' },
  { genre: '인디', title: '좋아해', artist: '볼빨간사춘기', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%A2%8B%EC%95%84%ED%95%B4+%EB%B3%BC%EB%B9%A8%EA%B0%84%EC%82%AC%EC%B6%98%EA%B8%B0' },
  { genre: '인디', title: '여수 밤바다', artist: '버스커 버스커', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%97%AC%EC%88%98+%EB%B0%A4%EB%B0%94%EB%8B%A4+%EB%B2%84%EC%8A%A4%EC%BB%A4+%EB%B2%84%EC%8A%A4%EC%BB%A4' },
  { genre: '인디', title: '200%', artist: '악동뮤지션 (AKMU)', youtubeUrl: 'https://www.youtube.com/results?search_query=200%25+AKMU' },

  // R&B (한국)
  { genre: 'R&B', title: 'D (Half Moon)', artist: 'DEAN', youtubeUrl: 'https://www.youtube.com/results?search_query=D+Half+Moon+DEAN' },
  { genre: 'R&B', title: '헤픈 우연', artist: '헤이즈', youtubeUrl: 'https://www.youtube.com/results?search_query=%ED%97%A4%ED%94%88+%EC%9A%B0%EC%97%B0+%ED%97%A4%EC%9D%B4%EC%A6%88' },
  { genre: 'R&B', title: '비도 오고 그래서', artist: '헤이즈', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%B9%84%EB%8F%84+%EC%98%A4%EA%B3%A0+%EA%B7%B8%EB%9E%98%EC%84%9C+%ED%97%A4%EC%9D%B4%EC%A6%88' },
  { genre: 'R&B', title: 'And July', artist: '헤이즈', youtubeUrl: 'https://www.youtube.com/results?search_query=And+July+%ED%97%A4%EC%9D%B4%EC%A6%88' },
  { genre: 'R&B', title: '너나 해', artist: '권진아', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%84%88%EB%82%98+%ED%95%B4+%EA%B6%8C%EC%A7%84%EC%95%84' },

  // 힙합 (한국)
  { genre: '힙합', title: '아무노래', artist: '지코', youtubeUrl: 'https://www.youtube.com/results?search_query=%EC%95%84%EB%AC%B4%EB%85%B8%EB%9E%98+%EC%A7%80%EC%BD%94' },
  { genre: '힙합', title: '쇼 미 더 머니', artist: '다이나믹 듀오', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%8B%A4%EC%9D%B4%EB%82%98%EB%AF%B9%EB%93%80%EC%98%A4' },
  { genre: '힙합', title: '붕붕', artist: '창모', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%B6%95%EB%B6%95+%EC%B0%BD%EB%AA%A8' },
  { genre: '힙합', title: '가리온', artist: '가리온', youtubeUrl: 'https://www.youtube.com/results?search_query=%EA%B0%80%EB%A6%AC%EC%98%A8' },
  { genre: '힙합', title: '땡', artist: 'BTS', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%95%85+BTS' },
];

async function main() {
  console.log('노래 데이터를 데이터베이스에 저장하는 중...');

  // 기존 노래 데이터 삭제 (선택사항)
  // @ts-expect-error - Prisma Client 타입이 아직 업데이트되지 않았을 수 있음 (TypeScript 캐시 문제)
  await prisma.song.deleteMany({});
  console.log('기존 노래 데이터 삭제 완료');

  // 노래 데이터 저장
  for (const song of songs) {
    // @ts-expect-error - Prisma Client 타입이 아직 업데이트되지 않았을 수 있음 (TypeScript 캐시 문제)
    await prisma.song.create({
      data: song,
    });
  }

  console.log(`${songs.length}개의 노래가 성공적으로 저장되었습니다.`);
  
  // 장르별 노래 개수 확인
  // @ts-expect-error - Prisma Client 타입이 아직 업데이트되지 않았을 수 있음 (TypeScript 캐시 문제)
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
