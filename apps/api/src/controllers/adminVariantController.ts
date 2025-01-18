import type { Request, Response } from 'express';
import * as adminVariantService from '../services/adminVariantService.js';
import { validated } from '../middleware/validate.js';
import type { CreateVariantInput, UpdateVariantInput } from '../schemas/adminVariant.js';
import type { IdParams } from '../schemas/common.js';

export async function listVariantsHandler(req: Request, res: Response): Promise<void> {
  const { id } = validated<IdParams>(req, 'params');
  res.json({ items: await adminVariantService.listVariants(id) });
}

export async function createVariantHandler(req: Request, res: Response): Promise<void> {
  const { id } = validated<IdParams>(req, 'params');
  const input = validated<CreateVariantInput>(req, 'body');
  res.status(201).json({ variant: await adminVariantService.createVariant(id, input) });
}

export async function updateVariantHandler(req: Request, res: Response): Promise<void> {
  const { id } = validated<IdParams>(req, 'params');
  const input = validated<UpdateVariantInput>(req, 'body');
  res.json({ variant: await adminVariantService.updateVariant(id, input) });
}

export async function deleteVariantHandler(req: Request, res: Response): Promise<void> {
  const { id } = validated<IdParams>(req, 'params');
  await adminVariantService.deleteVariant(id);
  res.status(204).end();
}
