import sharp from 'sharp';
import { badRequest } from '../utils/AppError.js';

// the format is decided by decoding the bytes, never by what the upload claimed to
// be: a filename extension and a Content-Type header are both written by the client.
// re-encoding everything also means only formats this process can produce ever get
// served, so a file that merely parses as an image isn't enough to get arbitrary
// bytes into the catalog.

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_PRODUCT = 6;

// what the decoder is allowed to open. checked against the actual contents.
const ACCEPTED_FORMATS: readonly string[] = ['jpeg', 'png', 'webp', 'avif'];

// only used to turn away an obviously wrong upload before its bytes are read. a
// courtesy to the caller, not a security check, that one happens below.
export const ACCEPTED_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

// phone cameras make images several times larger than any layout renders. fit-inside
// keeps the aspect ratio, and enlarging is refused since upscaling adds no detail.
const MAX_EDGE_PX = 1600;

const WEBP_QUALITY = 82;

// compression ratio isn't bounded by the file size limit. a few megabytes of png can
// decode to tens of gigabytes of pixels, which is one upload eating all the memory.
const MAX_INPUT_PIXELS = 50_000_000;

export interface ProcessedImage {
  data: Buffer;
  contentType: string;
  extension: string;
  width: number;
  height: number;
}

// output metadata is dropped, not copied. camera exif carries the capture location,
// and a product photo taken at home would publish an address along with the garment.
// orientation is the one tag that has to survive, so it's applied to the pixels
// first and then goes with the rest.
export async function processProductImage(input: Buffer): Promise<ProcessedImage> {
  const read = () => sharp(input, { limitInputPixels: MAX_INPUT_PIXELS });

  let format: string | undefined;
  try {
    ({ format } = await read().metadata());
  } catch {
    // raised for anything the decoder can't open, including a file that isn't an
    // image at all. the caller sent it, so the caller hears about it.
    throw badRequest('That file could not be read as an image');
  }

  if (format === undefined || !ACCEPTED_FORMATS.includes(format)) {
    throw badRequest(
      `Images must be ${ACCEPTED_FORMATS.join(', ')}, this one is ${format ?? 'unrecognised'}`,
    );
  }

  const { data, info } = await read()
    .rotate()
    .resize({ width: MAX_EDGE_PX, height: MAX_EDGE_PX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    contentType: 'image/webp',
    extension: 'webp',
    width: info.width,
    height: info.height,
  };
}
