import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import { slugify } from './taxonomy.js';

// colour and size live on Variant. putting them here makes "classic tee red M" and
// "classic tee red L" two products the ui has to re-join by name, and leaves nowhere
// to track stock per combination.
export interface Product {
  name: string;
  slug: string;
  description?: string;
  // cents. 19.99 has no exact binary representation, so totals drift once you
  // start adding floats together. an integer makes that unrepresentable.
  priceCents: number;
  brand: Types.ObjectId;
  category: Types.ObjectId;
  sex: Types.ObjectId;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<Product>;

const productSchema = new Schema<Product>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [120, 'Name must be at most 120 characters'],
    },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: [5000, 'Description is too long'] },
    priceCents: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Price must be an integer number of cents',
      },
    },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    sex: { type: Schema.Types.ObjectId, ref: 'Sex', required: true },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

productSchema.pre('validate', function (next) {
  if (typeof this.name === 'string' && (this.isModified('name') || !this.slug)) {
    this.slug = slugify(this.name);
  }
  next();
});

// not unique, two brands can both sell a "classic tee". slugs are for urls, not identity.
productSchema.virtual('variants', {
  ref: 'Variant',
  localField: '_id',
  foreignField: 'product',
});

export const Product: Model<Product> = model<Product>('Product', productSchema);
