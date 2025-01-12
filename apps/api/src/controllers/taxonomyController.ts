import type { Request, Response } from 'express';
import * as taxonomyService from '../services/taxonomyService.js';
import { validated } from '../middleware/validate.js';
import type { TaxonomyParams } from '../schemas/taxonomy.js';

export async function listAllTaxonomyHandler(_req: Request, res: Response): Promise<void> {
  res.json(await taxonomyService.listAllTaxonomy());
}

export async function listTaxonomyHandler(req: Request, res: Response): Promise<void> {
  const { kind } = validated<TaxonomyParams>(req, 'params');
  res.json({ items: await taxonomyService.listTaxonomy(kind) });
}
