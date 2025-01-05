import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export interface Taxonomy {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaxonomyDocument = HydratedDocument<Taxonomy>;

/** url-safe form of a name, so filters can read ?brand=nike instead of an objectid */
export function slugify(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      // dropped, not hyphenated, so "Levi's" slugs to "levis" and not "levi-s"
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );
}

function createTaxonomyModel(modelName: string): Model<Taxonomy> {
  const schema = new Schema<Taxonomy>(
    {
      name: {
        type: String,
        required: [true, `${modelName} name is required`],
        trim: true,
        minlength: [1, `${modelName} name must not be empty`],
        maxlength: [40, `${modelName} name must be at most 40 characters`],
      },
      slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
    },
    { timestamps: true },
  );

  schema.pre('validate', function (next) {
    if (typeof this.name === 'string' && (this.isModified('name') || !this.slug)) {
      this.slug = slugify(this.name);
    }
    next();
  });

  return model<Taxonomy>(modelName, schema);
}

export const Brand = createTaxonomyModel('Brand');
export const Color = createTaxonomyModel('Color');
export const Size = createTaxonomyModel('Size');
export const Category = createTaxonomyModel('Category');
export const Sex = createTaxonomyModel('Sex');

export const taxonomyModels = { Brand, Color, Size, Category, Sex } as const;
export type TaxonomyKind = keyof typeof taxonomyModels;
