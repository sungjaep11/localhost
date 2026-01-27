import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import { prisma } from "./lib/prisma";
import { songs } from "./seed-songs-data";

const execPromise = util.promisify(exec);

function buildSearchTerm(song: { title: string; artist: string }) {
  return `${song.title} ${song.artist} official audio`;
}

async function fetchFirstYoutubeVideoId(query: string): Promise<string | null> {
  try {
    // ytsearch1: tells yt-dlp to search and return the first result; --get-id only returns the video ID
    const command = `yt-dlp "ytsearch1:${query.replace(/"/g, '\\"')}" --get-id`;
    const { stdout } = await execPromise(command);
    const videoId = stdout.trim();
    return videoId || null;
  } catch {
    return null;
  }
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
