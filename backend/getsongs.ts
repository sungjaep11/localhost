import * as fs from "fs";
import * as path from "path";
import { prisma } from "./lib/prisma";
import { songs } from "./seed-songs-data";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

function buildSearchTerm(song: { title: string; artist: string }) {
  // 보통 "제목 가수 official audio"가 꽤 잘 맞음 (원하면 official mv로 바꿔도 됨)
  return `${song.title} ${song.artist} official audio`;
}

async function fetchFirstYoutubeVideoId(query: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY is missing in env");

  const params = new URLSearchParams({
    key: YOUTUBE_API_KEY,
    part: "snippet",
    type: "video",
    q: query,
    maxResults: "1",
    // regionCode를 KR로 두면 한국에서 보는 결과에 가까워짐 (원하면 JP/US 등으로 변경)
    regionCode: "KR",
    // relevanceLanguage도 참고용 (엄밀히 완전 동일 보장은 아님)
    relevanceLanguage: "ko",
    safeSearch: "none",
  });

  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as any;
  const item = data?.items?.[0];
  const videoId = item?.id?.videoId;
  return typeof videoId === "string" ? videoId : null;
}

function toWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

type SongRow = { genre: string; title: string; artist: string; youtubeUrl: string };

function formatSongsFile(rows: SongRow[]): string {
  const header =
    "/** Source for seed-songs. Run `npx ts-node getsongs.ts` to refresh youtubeUrl with watch links. */\nexport const songs: { genre: string; title: string; artist: string; youtubeUrl: string }[] = [\n";
  const lines = rows.map(
    (s) =>
      `  { genre: ${JSON.stringify(s.genre)}, title: ${JSON.stringify(s.title)}, artist: ${JSON.stringify(s.artist)}, youtubeUrl: ${JSON.stringify(s.youtubeUrl)} },`
  );
  return header + lines.join("\n") + "\n];\n";
}

async function main() {
  console.log("노래 데이터를 'watch?v=' 링크로 변환해 DB + seed-songs-data.ts 에 저장하는 중...");

  await prisma.song.deleteMany({});
  console.log("기존 노래 데이터 삭제 완료");

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let success = 0;
  let failed = 0;
  const updatedSongs: SongRow[] = [];

  for (const song of songs) {
    try {
      const q = buildSearchTerm(song);
      const videoId = await fetchFirstYoutubeVideoId(q);

      if (!videoId) {
        failed++;
        console.warn(`❌ 못 찾음: ${song.title} - ${song.artist}`);
        updatedSongs.push({ ...song, youtubeUrl: song.youtubeUrl });
        continue;
      }

      const watchUrl = toWatchUrl(videoId);
      await prisma.song.create({
        data: { ...song, youtubeUrl: watchUrl },
      });
      updatedSongs.push({ ...song, youtubeUrl: watchUrl });
      success++;
      console.log(`✅ ${song.title} -> ${watchUrl}`);
      await sleep(120);
    } catch (e) {
      failed++;
      console.warn(`❌ 에러: ${song.title} - ${song.artist}`, e);
      updatedSongs.push({ ...song, youtubeUrl: song.youtubeUrl });
    }
  }

  // Save updated songs (with watch URLs where found) into seed-songs-data.ts so seed-songs uses them
  const dataPath = path.resolve(process.cwd(), "seed-songs-data.ts");
  fs.writeFileSync(dataPath, formatSongsFile(updatedSongs), "utf-8");
  console.log(`seed-songs-data.ts 업데이트 완료 (${dataPath})`);

  console.log(`완료: 성공 ${success}, 실패 ${failed}, 총 ${songs.length}`);

  const genreCounts = await prisma.song.groupBy({
    by: ["genre"],
    _count: { genre: true },
  });

  console.log("\n장르별 노래 개수:");
  for (const item of genreCounts) {
    console.log(`  ${item.genre}: ${item._count.genre}개`);
  }
}

main()
  .catch((e) => {
    console.error("에러 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
