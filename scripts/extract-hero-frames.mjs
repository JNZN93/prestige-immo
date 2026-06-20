import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const videoPath = join(root, 'public/videos/127983-739777069_medium.mp4');
const outDir = join(root, 'public/videos/hero-frames');

/** Longer window into the finale; last frame is always the true video end. */
const frameCount = 120;
const clipSeconds = 15;
const contentRevealSeconds = 7;

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, args, (error, _stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stderr);
    });
  });
}

async function getVideoDuration() {
  const stderr = await runFfmpeg(['-hide_banner', '-i', videoPath, '-f', 'null', '-']);
  const match = stderr.match(/Duration:\s(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);

  if (!match) {
    throw new Error('Could not read video duration.');
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  return hours * 3600 + minutes * 60 + seconds;
}

async function extractFrames() {
  if (!ffmpegPath) {
    throw new Error('ffmpeg-static binary not found.');
  }

  await mkdir(outDir, { recursive: true });

  const duration = await getVideoDuration();
  const startTime = Math.max(0, duration - clipSeconds);
  const interiorFrames = frameCount - 1;
  const fps = interiorFrames / clipSeconds;
  const pattern = join(outDir, 'frame-%03d.jpg');
  const lastFramePath = join(outDir, `frame-${String(frameCount).padStart(3, '0')}.jpg`);

  // Frames 001…119: evenly sampled from [startTime … end), excluding the final slot.
  await runFfmpeg([
    '-hide_banner',
    '-loglevel',
    'error',
    '-ss',
    String(startTime),
    '-i',
    videoPath,
    '-t',
    String(clipSeconds),
    '-vf',
    `fps=${fps},scale=1440:-2:flags=lanczos`,
    '-frames:v',
    String(interiorFrames),
    '-q:v',
    '4',
    '-y',
    pattern,
  ]);

  // Frame 120: exact last frame of the source video.
  await runFfmpeg([
    '-hide_banner',
    '-loglevel',
    'error',
    '-sseof',
    '-0.04',
    '-i',
    videoPath,
    '-frames:v',
    '1',
    '-q:v',
    '4',
    '-y',
    lastFramePath,
  ]);

  const manifest = {
    frameCount,
    clipSeconds,
    fps: frameCount / clipSeconds,
    videoDuration: Number(duration.toFixed(2)),
    clipStartSeconds: Number(startTime.toFixed(2)),
    pattern: '/videos/hero-frames/frame-{index}.jpg',
    contentFadeLeadInFrames: Math.round((contentRevealSeconds / clipSeconds) * frameCount),
    endsAtVideoEnd: true,
  };

  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(
    `Extracted ${frameCount} frames (${startTime.toFixed(1)}s–${duration.toFixed(1)}s) to ${outDir}`,
  );
}

extractFrames().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
