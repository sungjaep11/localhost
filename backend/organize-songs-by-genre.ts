/**
 * songs/ 루트에 있는 mp3를 seed-songs-data와 매칭해 장르별 폴더로 옮김
 * 실행: npx ts-node organize-songs-by-genre.ts
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

function main() {
  const filenameToSong = new Map<string, (typeof songs)[0]>();
  for (const s of songs) {
    const name = `${fileBase(s)}.mp3`;
    if (!filenameToSong.has(name)) filenameToSong.set(name, s);
  }

  const direct = fs.readdirSync(SONGS_DIR, { withFileTypes: true });
  let moved = 0;
  const unmatched: string[] = [];

  for (const e of direct) {
    if (e.isDirectory()) continue;
    if (!e.name.toLowerCase().endsWith(".mp3")) continue;

    const song = filenameToSong.get(e.name);
    if (!song) {
      unmatched.push(e.name);
      continue;
    }

    const genreFolder = genreDir(song.genre);
    const destDir = path.join(SONGS_DIR, genreFolder);
    const destPath = path.join(destDir, e.name);
    const srcPath = path.join(SONGS_DIR, e.name);

    if (path.resolve(srcPath) === path.resolve(destPath)) continue;
    if (fs.existsSync(destPath)) {
      console.warn("skip (already exists):", destPath);
      continue;
    }

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.renameSync(srcPath, destPath);
    moved++;
    console.log("[moved]", genreFolder + "/" + e.name);
  }

  console.log("\nmoved %d into genre folders. unmatched: %d", moved, unmatched.length);
  if (unmatched.length > 0) {
    console.log("unmatched (left in songs/):");
    unmatched.forEach((n) => console.log("  -", n));
  }
}

main();
