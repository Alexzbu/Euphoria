import type { Request, Response } from 'express';
import * as adminTaxonomyService from '../services/adminTaxonomyService.js';
import { validated } from '../middleware/validate.js';
import type { TaxonomyBody, TaxonomyItemParams, TaxonomyParams } from '../schemas/taxonomy.js';

export async function createTaxonomyHandler(req: Request, res: Response): Promise<void> {
  const { kind } = validated<TaxonomyParams>(req, 'params');
  const { name } = validated<TaxonomyBody>(req, 'body');
  res.status(201).json({ item: await adminTaxonomyService.createTaxonomy(kind, name) });
}

export async function updateTaxonomyHandler(req: Request, res: Response): Promise<void> {
  const { kind, id } = validated<TaxonomyItemParams>(req, 'params');
  const { name } = validated<TaxonomyBody>(req, 'body');
  res.json({ item: await adminTaxonomyService.updateTaxonomy(kind, id, name) });
}

export async function deleteTaxonomyHandler(req: Request, res: Response): Promise<void> {
  const { kind, id } = validated<TaxonomyItemParams>(req, 'params');
  await adminTaxonomyService.deleteTaxonomy(kind, id);
  res.status(204).end();
}
