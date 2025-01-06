import bcrypt from 'bcrypt';
import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export const BCRYPT_ROUNDS = 12;

export interface User {
  email: string;
  // plaintext on assignment, bcrypt hash after save. never selected by default.
  password?: string;
  googleId?: string;
  role: Types.ObjectId;
  failedLoginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  isLocked(): boolean;
}

export type UserDocument = HydratedDocument<User, UserMethods>;

const userSchema = new Schema<User, Model<User, object, UserMethods>, UserMethods>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      // lowercased so uniqueness is case-insensitive. Alex@example.com and
      // alex@example.com must not end up as two accounts.
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email is not valid'],
    },
    password: { type: String, select: false, minlength: [8, 'Password is too short'] },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    failedLoginAttempts: { type: Number, default: 0, min: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true },
);

// a user with neither a password nor a google account can never sign in, and
// comparing against an absent hash throws instead of returning false, so the
// account would 500 at login where it should 401. catch it at write time.
userSchema.pre('validate', function (next) {
  if (this.isNew && !this.password && !this.googleId) {
    next(new Error('A user must have either a password or a linked Google account'));
    return;
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  next();
});

// password changes also arrive through findOneAndUpdate, and without this they'd
// go into the database in the clear.
userSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as { password?: string; $set?: { password?: string } } | null;
  if (!update) {
    next();
    return;
  }
  if (typeof update.password === 'string') {
    update.password = await bcrypt.hash(update.password, BCRYPT_ROUNDS);
  }
  if (typeof update.$set?.password === 'string') {
    update.$set.password = await bcrypt.hash(update.$set.password, BCRYPT_ROUNDS);
  }
  next();
});

userSchema.method('comparePassword', async function (candidate: string): Promise<boolean> {
  // a google-only account has no password, so compare has to answer false rather
  // than throw
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
});

userSchema.method('isLocked', function (): boolean {
  return this.lockUntil !== undefined && this.lockUntil.getTime() > Date.now();
});

export const User: Model<User, object, UserMethods> = model<User, Model<User, object, UserMethods>>(
  'User',
  userSchema,
);
