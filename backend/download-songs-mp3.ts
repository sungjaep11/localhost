/**
 * seed-songs-data의 유튜브 링크에서 MP3를 다운받아 backend/songs/ 에 저장하는 스크립트
 *
 * 필요: yt-dlp, ffmpeg
 *   - macOS: brew install yt-dlp ffmpeg
 *   - Ubuntu: sudo apt install yt-dlp ffmpeg
 *
 * 실행: npx ts-node download-songs-mp3.ts
 *   또는: npm run download:songs
 *
 * 실패분만 재시도: RETRY_ONLY=1 npm run download:songs
 *   (이미 있는 mp3는 건너뛰고 없는 곡만 다운로드)
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { songs } from "./seed-songs-data";

const SONGS_DIR = path.join(__dirname, "songs");
const INVALID_CHARS = /[<>:"/\\|?*]/g;

function safeFilename(s: string, maxLen = 80): string {
  return s.replace(INVALID_CHARS, "_").replace(/\s+/g, " ").trim().slice(0, maxLen);
}

function getVideoId(url: string): string | null {
  const u = (url || "").trim();
  // watch?v=... has "v=" right after "?", so match v= after watch? (don't require extra [?&])
  const m = u.match(/(?:youtube\.com\/watch\?.*?v=)([a-zA-Z0-9_-]{11})/) || u.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function main() {
  if (!fs.existsSync(SONGS_DIR)) {
    fs.mkdirSync(SONGS_DIR, { recursive: true });
    console.log("created:", SONGS_DIR);
  }

  const retryOnly = process.env.RETRY_ONLY === "1";
  const entries: { s: (typeof songs)[0]; i: number }[] = retryOnly
    ? songs
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => {
          const vid = getVideoId(s.youtubeUrl);
          if (!vid) return false;
          const base = `${vid}-${safeFilename(s.artist)}-${safeFilename(s.title)}`;
          return !fs.existsSync(path.join(SONGS_DIR, `${base}.mp3`));
        })
    : songs.map((s, i) => ({ s, i }));

  if (retryOnly) console.log("retry-only: %d missing of %d\n", entries.length, songs.length);

  const seen = new Set<string>();
  let ok = 0;
  let skip = 0;
  let err = 0;

  for (const { s, i } of entries) {
    const vid = getVideoId(s.youtubeUrl);
    if (!vid) {
      console.warn(`[${i + 1}/${songs.length}] skip (no video id): ${s.title} - ${s.artist}`);
      skip++;
      continue;
    }
    const base = `${vid}-${safeFilename(s.artist)}-${safeFilename(s.title)}`;
    const outFile = path.join(SONGS_DIR, `${base}.mp3`);
    if (seen.has(vid)) {
      console.log(`[${i + 1}/${songs.length}] skip (already have vid ${vid}): ${s.title} - ${s.artist}`);
      skip++;
      continue;
    }
    if (!retryOnly && fs.existsSync(outFile)) {
      console.log(`[${i + 1}/${songs.length}] exists: ${path.basename(outFile)}`);
      seen.add(vid);
      ok++;
      continue;
    }
    const outRel = `songs/${base}.%(ext)s`;
    try {
      execSync(`yt-dlp -x --audio-format mp3 --no-playlist --no-warnings -o ${JSON.stringify(outRel)} ${JSON.stringify(s.youtubeUrl)}`, {
        stdio: "inherit",
        cwd: __dirname,
      });
      seen.add(vid);
      ok++;
      console.log(`[${i + 1}/${songs.length}] ok: ${base}.mp3`);
    } catch (e) {
      err++;
      console.error(`[${i + 1}/${songs.length}] failed: ${s.title} - ${s.artist}`, e);
    }
  }

  console.log("\ndone. ok=%d skip=%d err=%d dir=%s", ok, skip, err, SONGS_DIR);
}

main();
