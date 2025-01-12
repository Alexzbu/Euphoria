import type { Request, Response } from 'express';
import * as productService from '../services/productService.js';
import { validated } from '../middleware/validate.js';
import type { ListProductsQuery } from '../schemas/product.js';
import type { IdParams } from '../schemas/common.js';

export async function listProductsHandler(req: Request, res: Response): Promise<void> {
  const query = validated<ListProductsQuery>(req, 'query');
  res.json(await productService.listProducts(query));
}

export async function getProductHandler(req: Request, res: Response): Promise<void> {
  const { id } = validated<IdParams>(req, 'params');
  res.json({ product: await productService.getProduct(id) });
}
