import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import type { ProcessedImage } from '../services/imageService.js';
import { buildImageKey, keyFromUrl, type ImageStorage, type StoredImage } from './imageStorage.js';

export function createDiskStorage(): ImageStorage {
  const root = path.resolve(env.UPLOAD_DIR);

  // every path is rebuilt from the root and checked to still be under it. keys are
  // generated here so today this can't fail, but a path built from a stored string is
  // exactly the shape that becomes a traversal once some later write path lets an
  // outside value in.
  // TODO: nothing prunes orphaned files if a delete fails. needs a sweep job.
  function resolveWithin(key: string): string | undefined {
    const file = path.resolve(root, key);
    const prefix = `${root}${path.sep}`;
    return file.startsWith(prefix) ? file : undefined;
  }

  return {
    driver: 'disk',
    localRoot: root,

    async save(image: ProcessedImage): Promise<StoredImage> {
      const key = buildImageKey(image.extension);
      const file = resolveWithin(key);
      if (!file) throw new Error(`Refusing to write outside the upload directory: ${key}`);

      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, image.data);

      return { key, url: `${env.MEDIA_BASE_PATH}/${key}` };
    },

    async remove(url: string): Promise<void> {
      const key = keyFromUrl(env.MEDIA_BASE_PATH, url);
      if (key === undefined) return;

      const file = resolveWithin(key);
      if (!file) return;

      // deleting a file that's already gone is the outcome that was asked for, so
      // it isn't an error worth failing a product update over
      await rm(file, { force: true });
    },
  };
}
