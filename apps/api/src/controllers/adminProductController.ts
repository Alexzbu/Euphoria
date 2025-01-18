import type { Request, Response } from 'express';
import * as adminProductService from '../services/adminProductService.js';
import { uploadedImages } from '../middleware/upload.js';
import { validated } from '../middleware/validate.js';
import type { CreateProductInput, UpdateProductInput } from '../schemas/adminProduct.js';
import type { IdParams } from '../schemas/common.js';

export async function createProductHandler(req: Request, res: Response): Promise<void> {
  const input = validated<CreateProductInput>(req, 'body');
  const product = await adminProductService.createProduct(input, uploadedImages(req));
  res.status(201).json({ product });
}

export async function updateProductHandler(req: Request, res: Response): Promise<void> {
  const { id } = validated<IdParams>(req, 'params');
  const input = validated<UpdateProductInput>(req, 'body');
  const product = await adminProductService.updateProduct(id, input, uploadedImages(req));
  res.json({ product });
}

// 204, it's gone and there's nothing left to describe
export async function deleteProductHandler(req: Request, res: Response): Promise<void> {
  const { id } = validated<IdParams>(req, 'params');
  await adminProductService.deleteProduct(id);
  res.status(204).end();
}
