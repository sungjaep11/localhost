/**
 * seed-songs-data의 유튜브 링크에서 MP3를 다운받아 backend/songs/ 에 저장하는 스크립트
 * 저장 경로: songs/<장르>/<제목>_<가수>.mp3 (장르별 폴더에 맞게 저장)
 *
 * 필요: yt-dlp, ffmpeg
 *   - macOS: brew install yt-dlp ffmpeg
 *   - Ubuntu: sudo apt install yt-dlp ffmpeg
 *
 * 실행: npm run download:songs
 *
 * 새 곡 추가/교체 후 흐름:
 *   1) npx ts-node getsongs.ts  → 유튜브 watch 링크 갱신 (YOUTUBE_API_KEY 필요)
 *   2) npm run download:songs   → mp3 다운로드 (songs/<장르>/ 에 저장)
 *
 * 실패분만 재시도: RETRY_ONLY=1 npm run download:songs
 * 다운 안 된 목록: 완료 후 songs/missing.txt 에 저장됨
 */

import { execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { songs } from "./seed-songs-data";

const SONGS_DIR = path.join(__dirname, "songs");
const INVALID_CHARS = /[<>:"/\\|?*]/g;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

function safeFilename(s: string, maxLen = 80): string {
  return s.replace(INVALID_CHARS, "_").replace(/\s+/g, " ").trim().slice(0, maxLen);
}

/** 장르명 → 폴더용 안전한 이름 */
function genreDir(genre: string): string {
  return safeFilename(genre) || "Other";
}

/** (제목)_(가수) 형태 파일명 */
function fileBase(s: (typeof songs)[0]): string {
  return `${safeFilename(s.title)}_${safeFilename(s.artist)}`;
}

/** 곡 s에 대한 저장 디렉터리 (songs/<장르>/) */
function songOutDir(s: (typeof songs)[0]): string {
  return path.join(SONGS_DIR, genreDir(s.genre));
}

/** 곡 s의 mp3 절대 경로 */
function songOutFile(s: (typeof songs)[0]): string {
  return path.join(songOutDir(s), `${fileBase(s)}.mp3`);
}

function getVideoId(url: string): string | null {
  const u = (url || "").trim();
  const m = u.match(/(?:youtube\.com\/watch\?.*?v=)([a-zA-Z0-9_-]{11})/) || u.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

interface YtDlpError extends Error {
  stderr?: string;
  stdout?: string;
}

function runYtDlp(url: string, outTemplate: string): void {
  const isYoutube = /youtube\.com|youtu\.be/.test(url);
  const args: string[] = [
    "-x", "--audio-format", "mp3",
    "--no-playlist", "--no-warnings",
    "--retries", "5", "--fragment-retries", "5", "--force-ipv4",
  ];
  if (isYoutube) {
    // ios 먼저, 실패 시 web으로 포맷 목록 가져오기 (ios만 쓰면 "Requested format is not available" 나올 수 있음)
    args.push("--extractor-args", "youtube:player_client=ios,web");
    // 오디오 우선, 없으면 아무 best 한 개 받아서 -x로 추출
    args.push("-f", "bestaudio/best");
  }
  args.push("-o", outTemplate, url);

  const result = spawnSync("yt-dlp", args, {
    stdio: ["inherit", "inherit", "pipe"],
    cwd: __dirname,
    maxBuffer: 10 * 1024 * 1024,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const err: YtDlpError = new Error(result.stderr || result.error?.message || "yt-dlp failed") as YtDlpError;
    err.stderr = (result.stderr || "").trim();
    err.stdout = (result.stdout || "").trim();
    throw err;
  }
}

function main() {
  if (!fs.existsSync(SONGS_DIR)) {
    fs.mkdirSync(SONGS_DIR, { recursive: true });
    console.log("created:", SONGS_DIR);
  }

  const retryOnly = process.env.RETRY_ONLY === "1";
  const entries: { s: (typeof songs)[0]; i: number }[] = retryOnly
    ? songs.map((s, i) => ({ s, i })).filter(({ s }) => !fs.existsSync(songOutFile(s)))
    : songs.map((s, i) => ({ s, i }));

  if (retryOnly) console.log("retry-only: %d missing of %d\n", entries.length, songs.length);

  const seen = new Set<string>();
  const failedList: { genre: string; title: string; artist: string; youtubeUrl: string }[] = [];
  let ok = 0;
  let skip = 0;
  let err = 0;

  for (const { s, i } of entries) {
    const vid = getVideoId(s.youtubeUrl);
    if (!vid) {
      console.warn(`[${i + 1}/${songs.length}] skip (no video id): ${s.title} - ${s.artist}`);
      skip++;
      failedList.push({ genre: s.genre, title: s.title, artist: s.artist, youtubeUrl: s.youtubeUrl });
      continue;
    }
    const outFile = songOutFile(s);
    const outDir = songOutDir(s);
    if (seen.has(vid)) {
      console.log(`[${i + 1}/${songs.length}] skip (already have vid ${vid}): ${s.title} - ${s.artist}`);
      skip++;
      continue;
    }
    if (!retryOnly && fs.existsSync(outFile)) {
      console.log(`[${i + 1}/${songs.length}] exists: ${s.genre}/${path.basename(outFile)}`);
      seen.add(vid);
      ok++;
      continue;
    }
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outTemplate = path.join(outDir, `${fileBase(s)}.%(ext)s`).replace(/\\/g, "/");
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        runYtDlp(s.youtubeUrl, outTemplate);
        if (fs.existsSync(outFile)) {
          seen.add(vid);
          ok++;
          console.log(`[${i + 1}/${songs.length}] ok: ${s.genre}/${path.basename(outFile)}`);
          break;
        }
      } catch (e) {
        lastError = e;
        const ytErr = e as YtDlpError;
        console.error(`[${i + 1}/${songs.length}] attempt ${attempt}/${MAX_ATTEMPTS} failed: ${s.title} - ${s.artist}`);
        if (typeof ytErr?.stderr === "string" && ytErr.stderr) {
          console.error("[다운 실패 이유] yt-dlp stderr:\n" + ytErr.stderr);
        } else {
          console.error("  ", String(e));
        }
        if (attempt < MAX_ATTEMPTS) {
          const sec = Math.ceil(RETRY_DELAY_MS / 1000);
          try {
            if (process.platform !== "win32") execSync(`sleep ${sec}`, { stdio: "ignore" });
            else execSync(`ping -n ${sec + 1} 127.0.0.1 > nul`, { stdio: "ignore" });
          } catch (_) {}
        }
      }
    }
    if (!seen.has(vid)) {
      err++;
      failedList.push({ genre: s.genre, title: s.title, artist: s.artist, youtubeUrl: s.youtubeUrl });
      const ytErr = lastError as YtDlpError;
      if (typeof ytErr?.stderr === "string" && ytErr.stderr) {
        console.error(`[${i + 1}/${songs.length}] 최종 실패 — ${s.title} / ${s.artist}\n[다운 실패 이유]\n${ytErr.stderr}`);
      } else if (lastError) {
        console.error(`[${i + 1}/${songs.length}] failed: ${s.title} - ${s.artist}`, lastError);
      }
    }
  }

  console.log("\ndone. ok=%d skip=%d err=%d dir=%s", ok, skip, err, SONGS_DIR);

  if (failedList.length > 0) {
    const missingPath = path.join(SONGS_DIR, "missing.txt");
    const lines = failedList.map((f) => `${f.genre}\t${f.title}\t${f.artist}\t${f.youtubeUrl}`);
    fs.writeFileSync(missingPath, lines.join("\n") + "\n", "utf8");
    console.log("\n[다운 안 된 목록] %d곡 — %s", failedList.length, missingPath);
    failedList.forEach((f, idx) => {
      console.log("  %d. [%s] %s - %s", idx + 1, f.genre, f.title, f.artist);
    });
  }
}

main();
