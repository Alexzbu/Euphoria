import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export const ROLES = ['ADMIN', 'CUSTOMER'] as const;
export type RoleName = (typeof ROLES)[number];

export interface Role {
  name: RoleName;
  createdAt: Date;
  updatedAt: Date;
}

export type RoleDocument = HydratedDocument<Role>;

const roleSchema = new Schema<Role>(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      enum: { values: [...ROLES], message: '{VALUE} is not a valid role' },
      unique: true,
      uppercase: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export const Role: Model<Role> = model<Role>('Role', roleSchema);
