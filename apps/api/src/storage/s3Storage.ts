import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import type { ProcessedImage } from '../services/imageService.js';
import { buildImageKey, keyFromUrl, type ImageStorage, type StoredImage } from './imageStorage.js';

// lets the api run as more than one instance: with the bytes off the local
// filesystem, nothing about which server handled the upload decides who serves the
// image afterwards.
//
// credentials are deliberately absent from the env schema. the sdk finds them where
// aws puts them, and requiring a key pair here would rule out an attached role.
export function createS3Storage(): ImageStorage {
  // guaranteed by the env schema, which requires both when this backend is selected
  const bucket = env.S3_BUCKET;
  const region = env.S3_REGION;

  if (bucket === undefined || region === undefined) {
    throw new Error('STORAGE_DRIVER=s3 requires S3_BUCKET and S3_REGION');
  }

  const client = new S3Client({
    region,
    // set for an s3-compatible store, minio or a local test double. those address
    // buckets by path instead of by subdomain.
    ...(env.S3_ENDPOINT !== undefined && { endpoint: env.S3_ENDPOINT, forcePathStyle: true }),
  });

  // not always where they were written. a cdn in front of the bucket is the usual
  // arrangement, and a custom endpoint means the bucket isn't on aws at all, so its
  // own address is the closest thing to a default.
  const baseUrl =
    env.S3_PUBLIC_BASE_URL ??
    (env.S3_ENDPOINT !== undefined
      ? `${env.S3_ENDPOINT.replace(/\/+$/, '')}/${bucket}`
      : `https://${bucket}.s3.${region}.amazonaws.com`);

  return {
    driver: 's3',

    async save(image: ProcessedImage): Promise<StoredImage> {
      const key = buildImageKey(image.extension);

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: image.data,
          ContentType: image.contentType,
          // keys are unique per upload and never change, so asking twice means a
          // cache dropped it
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );

      return { key, url: `${baseUrl}/${key}` };
    },

    async remove(url: string): Promise<void> {
      const key = keyFromUrl(baseUrl, url);
      if (key === undefined) return;

      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
