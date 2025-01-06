import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export interface Variant {
  product: Types.ObjectId;
  color: Types.ObjectId;
  size: Types.ObjectId;
  sku: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export type VariantDocument = HydratedDocument<Variant>;

const variantSchema = new Schema<Variant>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    color: { type: Schema.Types.ObjectId, ref: 'Color', required: true },
    size: { type: Schema.Types.ObjectId, ref: 'Size', required: true },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [40, 'SKU must be at most 40 characters'],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
      validate: { validator: Number.isInteger, message: 'Stock must be a whole number' },
    },
  },
  { timestamps: true },
);

// a product can't have the same colour/size combination twice, that's the
// definition of a duplicate variant. let the database refuse it instead of
// trusting every write path to remember.
variantSchema.index({ product: 1, color: 1, size: 1 }, { unique: true });

export const Variant: Model<Variant> = model<Variant>('Variant', variantSchema);
