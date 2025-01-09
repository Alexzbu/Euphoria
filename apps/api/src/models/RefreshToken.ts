import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export interface RefreshToken {
  tokenHash: string;
  user: Types.ObjectId;
  family: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

const refreshTokenSchema = new Schema<RefreshToken>(
  {
    tokenHash: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    family: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: true },
);

// revoking a whole chain, and listing a user's sessions, are both lookups
refreshTokenSchema.index({ family: 1 });
refreshTokenSchema.index({ user: 1 });

// mongo drops these once expiresAt passes so spent tokens don't pile up forever
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken: Model<RefreshToken> = model<RefreshToken>(
  'RefreshToken',
  refreshTokenSchema,
);
