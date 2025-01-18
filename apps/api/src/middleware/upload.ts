import type { RequestHandler } from 'express';
import multer, { MulterError } from 'multer';
import {
  ACCEPTED_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_PRODUCT,
} from '../services/imageService.js';
import { AppError, badRequest } from '../utils/AppError.js';

// multipart in, buffers out. nothing touches a filesystem here: every image is
// re-encoded before it's stored, so a file written on the way in would be the
// client's bytes and not the ones we're willing to serve. where they finally go is
// the storage adapter's call, and it isn't necessarily a disk.

export const IMAGES_FIELD = 'images';

const parseUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: MAX_IMAGES_PER_PRODUCT,
    // text fields ride along in the same request. a product has a handful.
    fields: 24,
  },
  fileFilter: (_req, file, accept) => {
    if (!ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
      accept(badRequest(`Images must be one of ${ACCEPTED_MIME_TYPES.join(', ')}`));
      return;
    }
    accept(null, true);
  },
}).array(IMAGES_FIELD, MAX_IMAGES_PER_PRODUCT);

const megabytes = (bytes: number): string => (bytes / 1024 / 1024).toFixed(0);

// multer raises these as ordinary exceptions, which the error handler turns into a
// 500. that says the server broke when really the file was just too big.
function translate(error: MulterError): AppError {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new AppError(
        413,
        `Each image must be ${megabytes(MAX_IMAGE_BYTES)} MB or smaller`,
        'PAYLOAD_TOO_LARGE',
      );
    case 'LIMIT_FILE_COUNT':
      return badRequest(`At most ${String(MAX_IMAGES_PER_PRODUCT)} images per product`);
    case 'LIMIT_UNEXPECTED_FILE':
      return badRequest(`Images must be sent in the "${IMAGES_FIELD}" field`);
    default:
      return badRequest('The upload could not be read');
  }
}

// has to be mounted ahead of body validation, because until this runs there's no
// req.body to validate. non-multipart requests pass straight through.
// TODO: multipart text fields all arrive as strings, so schemas behind this need
// coerce. caught me out twice already.
export const uploadImages: RequestHandler = (req, res, next) => {
  parseUpload(req, res, (error: unknown) => {
    if (error instanceof MulterError) {
      next(translate(error));
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
};

/** the uploaded files, in the order the client sent them */
export function uploadedImages(req: { files?: unknown }): Express.Multer.File[] {
  return Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];
}
