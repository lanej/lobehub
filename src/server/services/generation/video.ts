import { type LobeChatDatabase } from '@lobechat/database';
import debug from 'debug';
import ffmpeg from 'fluent-ffmpeg';
import { sha256 } from 'js-sha256';
import { nanoid } from 'nanoid';
import { createWriteStream, promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import sharp from 'sharp';

import { FileService } from '@/server/services/file';
import { calculateThumbnailDimensions } from '@/utils/number';
import { getYYYYmmddHHMMss } from '@/utils/time';

const log = debug('lobe-video:generation-service');

let ffmpegPathInitialized = false;

function ensureFfmpegPath() {
  if (ffmpegPathInitialized) return;
  // eslint-disable-next-line unicorn/prefer-module
  const ffmpegPath = require('ffmpeg-static') as string;
  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpegPathInitialized = true;
}

interface VideoMetadata {
  duration: number;
  height: number;
  width: number;
}

export interface VideoProcessResult {
  coverKey: string;
  duration: number;
  fileHash: string;
  fileSize: number;
  height: number;
  mimeType: string;
  thumbnailKey: string;
  videoKey: string;
  width: number;
}

export class VideoGenerationService {
  private fileService: FileService;

  constructor(db: LobeChatDatabase, userId: string) {
    this.fileService = new FileService(db, userId);
  }

  /**
   * Download video, extract metadata, generate cover/thumbnail, upload all to S3
   */
  async processVideoForGeneration(videoUrl: string): Promise<VideoProcessResult> {
    log('Processing video from URL: %s', videoUrl);
    ensureFfmpegPath();

    let tempVideoPath: string | null = null;
    let tempCoverPath: string | null = null;

    try {
      tempVideoPath = await this.downloadVideo(videoUrl);

      const [metadata, videoBuffer] = await Promise.all([
        this.getVideoMetadata(tempVideoPath),
        fs.readFile(tempVideoPath),
      ]);

      log('Video metadata: %O', metadata);

      const fileHash = sha256(videoBuffer);
      const fileSize = videoBuffer.length;

      // Determine MIME type from URL or default to mp4
      const ext = path.extname(new URL(videoUrl).pathname).toLowerCase();
      const mimeType = ext === '.webm' ? 'video/webm' : 'video/mp4';
      const videoExt = ext || '.mp4';

      // Generate S3 keys
      const uuid = nanoid();
      const dateTime = getYYYYmmddHHMMss(new Date());
      const generationsFolder = 'generations/videos';

      // Upload video
      const videoKey = `${generationsFolder}/${uuid}_${metadata.width}x${metadata.height}_${dateTime}_raw${videoExt}`;
      log('Uploading video to: %s', videoKey);
      await this.fileService.uploadMedia(videoKey, videoBuffer);

      // Generate cover screenshot and thumbnail
      tempCoverPath = await this.generateScreenshot(tempVideoPath, metadata.width, metadata.height);
      const coverBuffer = await fs.readFile(tempCoverPath);

      // Convert cover to webp
      const coverWebpBuffer = await sharp(coverBuffer).webp({ quality: 100 }).toBuffer();
      const coverKey = `${generationsFolder}/${uuid}_${metadata.width}x${metadata.height}_${dateTime}_cover.webp`;
      log('Uploading cover to: %s', coverKey);

      // Calculate thumbnail dimensions
      const { shouldResize, thumbnailWidth, thumbnailHeight } = calculateThumbnailDimensions(
        metadata.width,
        metadata.height,
      );

      let thumbnailKey: string;

      if (shouldResize) {
        const thumbnailBuffer = await sharp(coverBuffer)
          .resize(thumbnailWidth, thumbnailHeight, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 100 })
          .toBuffer();

        thumbnailKey = `${generationsFolder}/${uuid}_${thumbnailWidth}x${thumbnailHeight}_${dateTime}_thumb.webp`;
        log('Uploading thumbnail to: %s', thumbnailKey);

        // Upload cover and thumbnail in parallel
        await Promise.all([
          this.fileService.uploadMedia(coverKey, coverWebpBuffer),
          this.fileService.uploadMedia(thumbnailKey, thumbnailBuffer),
        ]);
      } else {
        // Cover and thumbnail are the same size, reuse the same key
        thumbnailKey = coverKey;
        await this.fileService.uploadMedia(coverKey, coverWebpBuffer);
      }

      log('Video processing completed successfully');

      return {
        coverKey,
        duration: metadata.duration,
        fileHash,
        fileSize,
        height: metadata.height,
        mimeType,
        thumbnailKey,
        videoKey,
        width: metadata.width,
      };
    } finally {
      // Clean up temp files
      if (tempVideoPath) {
        await fs.unlink(tempVideoPath).catch((err) => {
          log('Failed to cleanup temp video file: %O', err);
        });
      }
      if (tempCoverPath) {
        await fs.unlink(tempCoverPath).catch((err) => {
          log('Failed to cleanup temp cover file: %O', err);
        });
      }
    }
  }

  private async downloadVideo(url: string): Promise<string> {
    const ext = path.extname(new URL(url).pathname).toLowerCase() || '.mp4';
    const tempVideoPath = path.join(os.tmpdir(), `lobe-video-${nanoid()}${ext}`);
    log('Downloading video to: %s', tempVideoPath);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error(`Response body is empty for video URL: ${url}`);
    }

    await pipeline(Readable.fromWeb(response.body as any), createWriteStream(tempVideoPath));

    log('Video downloaded successfully');
    return tempVideoPath;
  }

  private async getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) return reject(err);

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        if (!videoStream) {
          return reject(new Error('No video stream found'));
        }

        const { width, height, duration } = videoStream;

        resolve({
          duration: typeof duration === 'string' ? Number.parseFloat(duration) : duration || 0,
          height: Number(height) || 0,
          width: Number(width) || 0,
        });
      });
    });
  }

  /**
   * Take a screenshot at 0.1s and return the temp file path
   */
  private async generateScreenshot(
    videoPath: string,
    width: number,
    height: number,
  ): Promise<string> {
    const screenshotDir = os.tmpdir();
    const screenshotFilename = `lobe-cover-${nanoid()}.jpg`;

    log('Generating screenshot from video');

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          filename: screenshotFilename,
          folder: screenshotDir,
          size: `${width}x${height}`,
          timestamps: ['00:00:00.1'],
        })
        .on('end', () => resolve())
        .on('error', reject);
    });

    return path.join(screenshotDir, screenshotFilename);
  }
}
