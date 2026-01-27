/**
 * seed-songs-data 중 songs/<장르>/ 에 파일이 없는 곡 목록 출력
 * 실행: npx ts-node list-missing-songs.ts
 */
import * as fs from "fs";
import * as path from "path";
import { songs } from "./seed-songs-data";

const SONGS_DIR = path.join(__dirname, "songs");
const INVALID_CHARS = /[<>:"/\\|?*]/g;

function safeFilename(s: string, maxLen = 80): string {
  return s.replace(INVALID_CHARS, "_").replace(/\s+/g, " ").trim().slice(0, maxLen);
}
function genreDir(genre: string): string {
  return safeFilename(genre) || "Other";
}
function fileBase(s: (typeof songs)[0]): string {
  return `${safeFilename(s.title)}_${safeFilename(s.artist)}`;
}
function songOutFile(s: (typeof songs)[0]): string {
  return path.join(SONGS_DIR, genreDir(s.genre), `${fileBase(s)}.mp3`);
}

const missing = songs.filter((s) => !fs.existsSync(songOutFile(s)));
console.log("missing count:", missing.length);
missing.forEach((s, i) => {
  console.log(`${i + 1}. [${s.genre}] ${s.title} - ${s.artist}`);
});
