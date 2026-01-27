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
 *
 * "Sign in to confirm you're not a bot" 나오면 쿠키 사용:
 *   YTDLP_COOKIES=chrome npm run download:songs   (Chrome 로그인 쿠키)
 *   또는 YTDLP_COOKIES_FILE=/path/to/cookies.txt npm run download:songs
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

/** (제목)_(가수) 형태 파일명용 */
function fileBase(s: (typeof songs)[0]): string {
  return `${safeFilename(s.title)}_${safeFilename(s.artist)}`;
}

function getVideoId(url: string): string | null {
  const u = (url || "").trim();
  const m = u.match(/(?:youtube\.com\/watch\?.*?v=)([a-zA-Z0-9_-]{11})/) || u.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export interface YtDlpError extends Error {
  stderr?: string;
  stdout?: string;
}

function runYtDlp(url: string, outTemplate: string): void {
  const isYoutube = /youtube\.com|youtu\.be/.test(url);

  // 기본 옵션 (출력 경로와 URL은 맨 마지막에만 추가)
  const args: string[] = [
    "-x",
    "--audio-format", "mp3",
    "--no-playlist",
    "--no-warnings",
    "--retries", "5",
    "--fragment-retries", "5",
    "--force-ipv4",
  ];

  if (isYoutube) {
    args.push("--extractor-args", "youtube:player_client=ios");
  }

  const cookies = process.env.YTDLP_COOKIES;
  const cookiesFile = process.env.YTDLP_COOKIES_FILE;
  if (cookies) {
    args.push("--cookies-from-browser", cookies);
  } else if (cookiesFile) {
    args.push("--cookies", cookiesFile);
  }

  args.push("-o", outTemplate, url);

  const result = spawnSync("yt-dlp", args, {
    stdio: ["inherit", "inherit", "pipe"],
    cwd: __dirname,
    maxBuffer: 10 * 1024 * 1024,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const err: YtDlpError = new Error(
      result.stderr || result.error?.message || "yt-dlp exited with non-zero code"
    ) as YtDlpError;
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
    ? songs
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => {
          const base = fileBase(s);
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
    const base = fileBase(s);
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
    const outTemplate = path.join(SONGS_DIR, `${base}.%(ext)s`).replace(/\\/g, "/");
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        runYtDlp(s.youtubeUrl, outTemplate);
        if (fs.existsSync(outFile)) {
          seen.add(vid);
          ok++;
          console.log(`[${i + 1}/${songs.length}] ok: ${base}.mp3`);
          break;
        }
      } catch (e) {
        lastError = e;
        const last = attempt === MAX_ATTEMPTS;
        console.error(`[${i + 1}/${songs.length}] attempt ${attempt}/${MAX_ATTEMPTS} failed: ${s.title} - ${s.artist}`);
        const ytErr = e as YtDlpError;
        if (typeof ytErr?.stderr === "string" && ytErr.stderr) {
          console.error("[다운 실패 이유] yt-dlp stderr:\n" + ytErr.stderr);
        } else {
          console.error("  ", String(e));
        }
        if (!last) {
          console.log(`  retrying in ${RETRY_DELAY_MS / 1000}s...`);
          const sec = Math.ceil(RETRY_DELAY_MS / 1000);
          if (process.platform !== "win32") {
            try {
              execSync(`sleep ${sec}`, { stdio: "ignore" });
            } catch (_) {
              for (const d = Date.now() + RETRY_DELAY_MS; Date.now() < d; ) {}
            }
          } else {
            try {
              execSync(`ping -n ${sec + 1} 127.0.0.1 > nul`, { stdio: "ignore" });
            } catch (_) {
              for (const d = Date.now() + RETRY_DELAY_MS; Date.now() < d; ) {}
            }
          }
        }
      }
    }
    if (!seen.has(vid)) {
      err++;
      const ytErr = lastError as YtDlpError;
      if (typeof ytErr?.stderr === "string" && ytErr.stderr) {
        console.error(`[${i + 1}/${songs.length}] 최종 실패 요약 — ${s.title} / ${s.artist}\n[다운 실패 이유]\n${ytErr.stderr}`);
      } else if (lastError) {
        console.error(`[${i + 1}/${songs.length}] failed: ${s.title} - ${s.artist}`, lastError);
      }
    }
  }

  console.log("\ndone. ok=%d skip=%d err=%d dir=%s", ok, skip, err, SONGS_DIR);
}

main();
