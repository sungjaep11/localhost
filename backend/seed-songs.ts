import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  { genre: 'K-pop', title: 'Dynamite', artist: 'BTS', youtubeUrl: 'https://www.youtube.com/results?search_query=Dynamite+BTS' },
  { genre: 'K-pop', title: 'Butter', artist: 'BTS', youtubeUrl: 'https://www.youtube.com/results?search_query=Butter+BTS' },
  { genre: 'K-pop', title: 'Gangnam Style', artist: 'PSY', youtubeUrl: 'https://www.youtube.com/results?search_query=Gangnam+Style+PSY' },
  { genre: 'K-pop', title: 'Gee', artist: '소녀시대 (Girls\' Generation)', youtubeUrl: 'https://www.youtube.com/results?search_query=Gee+Girls+Generation' },
  { genre: 'K-pop', title: 'CHEER UP', artist: 'TWICE', youtubeUrl: 'https://www.youtube.com/results?search_query=CHEER+UP+TWICE' },
  { genre: 'K-pop', title: 'TT', artist: 'TWICE', youtubeUrl: 'https://www.youtube.com/results?search_query=TT+TWICE' },
  { genre: 'K-pop', title: 'Love Scenario', artist: 'iKON', youtubeUrl: 'https://www.youtube.com/results?search_query=Love+Scenario+iKON' },
  { genre: 'K-pop', title: 'Hype Boy', artist: 'NewJeans', youtubeUrl: 'https://www.youtube.com/results?search_query=Hype+Boy+NewJeans' },
  { genre: 'K-pop', title: 'Love Dive', artist: 'IVE', youtubeUrl: 'https://www.youtube.com/results?search_query=LOVE+DIVE+IVE' },
  { genre: 'K-pop', title: 'Next Level', artist: 'aespa', youtubeUrl: 'https://www.youtube.com/results?search_query=Next+Level+aespa' },

  // J-pop
  { genre: 'J-pop', title: 'Lemon', artist: '米津玄師 (Kenshi Yonezu)', youtubeUrl: 'https://www.youtube.com/results?search_query=Lemon+Kenshi+Yonezu' },
  { genre: 'J-pop', title: 'Pretender', artist: 'Official髭男dism', youtubeUrl: 'https://www.youtube.com/results?search_query=Pretender+Official+HIGE+DANDism' },
  { genre: 'J-pop', title: 'Marunouchi Sadistic', artist: '椎名林檎 (Ringo Sheena)', youtubeUrl: 'https://www.youtube.com/results?search_query=Marunouchi+Sadistic+Ringo+Sheena' },
  { genre: 'J-pop', title: '夜に駆ける (Yoru ni Kakeru)', artist: 'YOASOBI', youtubeUrl: 'https://www.youtube.com/results?search_query=YOASOBI+%E5%A4%9C%E3%81%AB%E9%A7%86%E3%81%91%E3%82%8B' },
  { genre: 'J-pop', title: '紅蓮華 (Gurenge)', artist: 'LiSA', youtubeUrl: 'https://www.youtube.com/results?search_query=LiSA+Gurenge' },
  { genre: 'J-pop', title: '残酷な天使のテーゼ', artist: '高橋洋子', youtubeUrl: 'https://www.youtube.com/results?search_query=%E6%AE%8B%E9%85%B7%E3%81%AA%E5%A4%A9%E4%BD%BF%E3%81%AE%E3%83%86%E3%83%BC%E3%82%BC+%E9%AB%98%E6%A9%8B%E6%B4%8B%E5%AD%90' },
  { genre: 'J-pop', title: '小さな恋のうた', artist: 'MONGOL800', youtubeUrl: 'https://www.youtube.com/results?search_query=%E5%B0%8F%E3%81%95%E3%81%AA%E6%81%8B%E3%81%AE%E3%81%86%E3%81%9F+MONGOL800' },
  { genre: 'J-pop', title: '風吹けば恋 (Kaze ga Fuiteiru)', artist: 'いきものがかり', youtubeUrl: 'https://www.youtube.com/results?search_query=%E9%A2%A8%E3%81%8C%E5%90%B9%E3%81%84%E3%81%A6%E3%81%84%E3%82%8B+%E3%81%84%E3%81%8D%E3%82%82%E3%81%AE%E3%81%8C%E3%81%8B%E3%82%8A' },
  { genre: 'J-pop', title: '打上花火', artist: 'DAOKO × 米津玄師', youtubeUrl: 'https://www.youtube.com/results?search_query=%E6%89%93%E4%B8%8A%E8%8A%B1%E7%81%AB+DAOKO+%E7%B1%B3%E6%B4%A5%E7%8E%84%E5%B8%AB' },
  { genre: 'J-pop', title: '世界に一つだけの花', artist: 'SMAP', youtubeUrl: 'https://www.youtube.com/results?search_query=%E4%B8%96%E7%95%8C%E3%81%AB%E4%B8%80%E3%81%A4%E3%81%A0%E3%81%91%E3%81%AE%E8%8A%B1+SMAP' },

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

  // 댄스
  { genre: '댄스', title: 'Billie Jean', artist: 'Michael Jackson', youtubeUrl: 'https://www.youtube.com/results?search_query=Billie+Jean+Michael+Jackson' },
  { genre: '댄스', title: 'September', artist: 'Earth, Wind & Fire', youtubeUrl: 'https://www.youtube.com/results?search_query=September+Earth+Wind+%26+Fire' },
  { genre: '댄스', title: 'I Gotta Feeling', artist: 'The Black Eyed Peas', youtubeUrl: 'https://www.youtube.com/results?search_query=I+Gotta+Feeling+Black+Eyed+Peas' },
  { genre: '댄스', title: 'Wake Me Up', artist: 'Avicii', youtubeUrl: 'https://www.youtube.com/results?search_query=Wake+Me+Up+Avicii' },
  { genre: '댄스', title: 'One More Time', artist: 'Daft Punk', youtubeUrl: 'https://www.youtube.com/results?search_query=One+More+Time+Daft+Punk' },
  { genre: '댄스', title: 'Party Rock Anthem', artist: 'LMFAO', youtubeUrl: 'https://www.youtube.com/results?search_query=Party+Rock+Anthem+LMFAO' },
  { genre: '댄스', title: 'Can\'t Stop the Feeling!', artist: 'Justin Timberlake', youtubeUrl: 'https://www.youtube.com/results?search_query=Can%27t+Stop+the+Feeling+Justin+Timberlake' },
  { genre: '댄스', title: 'Titanium', artist: 'David Guetta ft. Sia', youtubeUrl: 'https://www.youtube.com/results?search_query=Titanium+David+Guetta+Sia' },
  { genre: '댄스', title: 'Get Lucky', artist: 'Daft Punk ft. Pharrell Williams', youtubeUrl: 'https://www.youtube.com/results?search_query=Get+Lucky+Daft+Punk+Pharrell' },
  { genre: '댄스', title: 'Levitating', artist: 'Dua Lipa', youtubeUrl: 'https://www.youtube.com/results?search_query=Levitating+Dua+Lipa' },

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

  // R&B
  { genre: 'R&B', title: 'Instagram', artist: 'DEAN', youtubeUrl: 'https://www.youtube.com/results?search_query=Instagram+DEAN' },
  { genre: 'R&B', title: 'Love', artist: 'Keyshia Cole', youtubeUrl: 'https://www.youtube.com/results?search_query=Love+Keyshia+Cole' },
  { genre: 'R&B', title: 'No Scrubs', artist: 'TLC', youtubeUrl: 'https://www.youtube.com/results?search_query=No+Scrubs+TLC' },
  { genre: 'R&B', title: 'Say My Name', artist: 'Destiny\'s Child', youtubeUrl: 'https://www.youtube.com/results?search_query=Say+My+Name+Destiny%27s+Child' },
  { genre: 'R&B', title: 'We Belong Together', artist: 'Mariah Carey', youtubeUrl: 'https://www.youtube.com/results?search_query=We+Belong+Together+Mariah+Carey' },
  { genre: 'R&B', title: 'U Remind Me', artist: 'Usher', youtubeUrl: 'https://www.youtube.com/results?search_query=U+Remind+Me+Usher' },
  { genre: 'R&B', title: 'Adorn', artist: 'Miguel', youtubeUrl: 'https://www.youtube.com/results?search_query=Adorn+Miguel' },
  { genre: 'R&B', title: 'Earned It', artist: 'The Weeknd', youtubeUrl: 'https://www.youtube.com/results?search_query=Earned+It+The+Weeknd' },
  { genre: 'R&B', title: 'Best Part', artist: 'Daniel Caesar ft. H.E.R.', youtubeUrl: 'https://www.youtube.com/results?search_query=Best+Part+Daniel+Caesar+H.E.R.' },
  { genre: 'R&B', title: 'Kiss It Better', artist: 'Rihanna', youtubeUrl: 'https://www.youtube.com/results?search_query=Kiss+It+Better+Rihanna' },

  // 힙합
  { genre: '힙합', title: 'Lose Yourself', artist: 'Eminem', youtubeUrl: 'https://www.youtube.com/results?search_query=Lose+Yourself+Eminem' },
  { genre: '힙합', title: 'HUMBLE.', artist: 'Kendrick Lamar', youtubeUrl: 'https://www.youtube.com/results?search_query=HUMBLE+Kendrick+Lamar' },
  { genre: '힙합', title: 'SICKO MODE', artist: 'Travis Scott', youtubeUrl: 'https://www.youtube.com/results?search_query=SICKO+MODE+Travis+Scott' },
  { genre: '힙합', title: 'God\'s Plan', artist: 'Drake', youtubeUrl: 'https://www.youtube.com/results?search_query=God%27s+Plan+Drake' },
  { genre: '힙합', title: 'Old Town Road', artist: 'Lil Nas X', youtubeUrl: 'https://www.youtube.com/results?search_query=Old+Town+Road+Lil+Nas+X' },
  { genre: '힙합', title: 'N.Y. State of Mind', artist: 'Nas', youtubeUrl: 'https://www.youtube.com/results?search_query=N.Y.+State+of+Mind+Nas' },
  { genre: '힙합', title: 'Juicy', artist: 'The Notorious B.I.G.', youtubeUrl: 'https://www.youtube.com/results?search_query=Juicy+Notorious+B.I.G.' },
  { genre: '힙합', title: 'Still D.R.E.', artist: 'Dr. Dre ft. Snoop Dogg', youtubeUrl: 'https://www.youtube.com/results?search_query=Still+D.R.E.+Dr.+Dre+Snoop+Dogg' },
  { genre: '힙합', title: 'Ddaeng', artist: 'BTS', youtubeUrl: 'https://www.youtube.com/results?search_query=%EB%95%85+BTS' },
  { genre: '힙합', title: 'BAND', artist: '창모 (CHANGMO)', youtubeUrl: 'https://www.youtube.com/results?search_query=BAND+%EC%B0%BD%EB%AA%A8' },
];

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
    _count: true,
  });
  
  console.log('\n장르별 노래 개수:');
  genreCounts.forEach(({ genre, _count }) => {
    console.log(`  ${genre}: ${_count}개`);
  });
}

main()
  .catch((e) => {
    console.error('에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
