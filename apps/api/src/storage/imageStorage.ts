import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import type { ProcessedImage } from '../services/imageService.js';
import { createDiskStorage } from './diskStorage.js';
import { createS3Storage } from './s3Storage.js';

// the catalog only ever needs two operations, keep these bytes and forget that
// image, so that's the whole interface. everything a particular backend cares about
// (a directory, a bucket, a cdn hostname) stays behind it, which is what lets one
// deployment serve images off local disk and the next off s3 unchanged.

export interface StoredImage {
  key: string;
  url: string;
}

export interface ImageStorage {
  readonly driver: string;

  save(image: ProcessedImage): Promise<StoredImage>;

  // takes the stored url, not a key, because the url is what the product document
  // holds. a url this backend didn't write is ignored: some images are static assets
  // that were never uploaded.
  remove(url: string): Promise<void>;

  // set only by a backend keeping bytes on this server's filesystem, which is then
  // also this server's job to serve. absent for anything remote.
  readonly localRoot?: string;
}

// grouped by month. a single flat directory works right up until the day it holds a
// hundred thousand files and every ls on it hangs.
//
// the name keeps no trace of what the client called the file. an uploaded name is
// attacker-controlled text that would end up in a path and a url.
export function buildImageKey(extension: string): string {
  const now = new Date();
  const month = `${String(now.getUTCFullYear())}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `products/${month}/${randomUUID()}.${extension}`;
}

export function keyFromUrl(baseUrl: string, url: string): string | undefined {
  const prefix = `${baseUrl}/`;
  if (!url.startsWith(prefix)) return undefined;

  const key = decodeURIComponent(url.slice(prefix.length));
  return key.length > 0 ? key : undefined;
}

function createImageStorage(): ImageStorage {
  return env.STORAGE_DRIVER === 's3' ? createS3Storage() : createDiskStorage();
}

export const imageStorage: ImageStorage = createImageStorage();
