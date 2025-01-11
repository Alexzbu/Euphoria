import type { Types } from 'mongoose';
import { Role, type RoleName } from '../models/Role.js';
import { User, type UserDocument } from '../models/User.js';
import { AppError, conflict, unauthorized } from '../utils/AppError.js';
import { issueRefreshToken, rotateRefreshToken } from './refreshTokenService.js';
import { signAccessToken } from './tokenService.js';

export interface PublicUser {
  id: string;
  email: string;
  role: RoleName;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  user: PublicUser;
}

// mongo's error code for a unique-index violation
const DUPLICATE_KEY = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'code' in error && error.code === DUPLICATE_KEY
  );
}

async function roleNameFor(roleId: Types.ObjectId): Promise<RoleName> {
  const role = await Role.findById(roleId).lean();
  if (!role) {
    // the reference exists but its target doesn't, which is a data problem on our
    // side, not something the caller did wrong
    throw new AppError(500, 'User role could not be resolved', 'ROLE_MISSING');
  }
  return role.name;
}

async function completeSignIn(user: UserDocument): Promise<AuthResult> {
  const role = await roleNameFor(user.role);
  const { token, expiresAt } = await issueRefreshToken(user._id);

  return {
    accessToken: signAccessToken({ sub: user._id.toString(), role }),
    refreshToken: token,
    refreshExpiresAt: expiresAt,
    user: { id: user._id.toString(), email: user.email, role },
  };
}

export async function register(email: string, password: string): Promise<AuthResult> {
  const customerRole = await Role.findOne({ name: 'CUSTOMER' }).lean();
  if (!customerRole) {
    throw new AppError(500, 'Default role is not configured', 'ROLE_MISSING');
  }

  try {
    const user = await User.create({ email, password, role: customerRole._id });
    return await completeSignIn(user);
  } catch (error) {
    // only a duplicate email becomes "that email is taken". everything else keeps its
    // own meaning, collapsing them sends people off to reset a password that was fine.
    if (isDuplicateKeyError(error)) {
      throw conflict('An account with this email already exists');
    }
    throw error;
  }
}

// the role is looked up by name and stored as a reference, same as a password
// registration. reading a role off an unpopulated reference finds an objectid, and
// the user ends up with no usable role, which only surfaces later as a permission
// check that denies everything.
export async function signInWithGoogle(googleId: string, email: string): Promise<UserDocument> {
  const existing = await User.findOne({ $or: [{ googleId }, { email }] });

  if (existing) {
    // same person, new door. link the identity instead of refusing, so google
    // sign-in doesn't make a second account for someone who registered with a password.
    if (!existing.googleId) {
      existing.googleId = googleId;
      await existing.save();
    }
    return existing;
  }

  const customerRole = await Role.findOne({ name: 'CUSTOMER' }).lean();
  if (!customerRole) {
    throw new AppError(500, 'Default role is not configured', 'ROLE_MISSING');
  }

  return User.create({ email, googleId, role: customerRole._id });
}

export async function issueSessionFor(user: UserDocument): Promise<AuthResult> {
  return completeSignIn(user);
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await User.findOne({ email }).select('+password');

  // one message and one status for both "no such account" and "wrong password".
  // splitting them turns the login form into an oracle for which emails exist.
  if (!user || !(await user.comparePassword(password))) {
    throw unauthorized('Invalid email or password');
  }

  return completeSignIn(user);
}

export async function refresh(token: string): Promise<AuthResult> {
  const { userId, issued } = await rotateRefreshToken(token);

  const user = await User.findById(userId);
  if (!user) throw unauthorized('Account no longer exists');

  const role = await roleNameFor(user.role);
  return {
    accessToken: signAccessToken({ sub: user._id.toString(), role }),
    refreshToken: issued.token,
    refreshExpiresAt: issued.expiresAt,
    user: { id: user._id.toString(), email: user.email, role },
  };
}

export async function currentUser(userId: string): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user) throw unauthorized('Account no longer exists');

  return {
    id: user._id.toString(),
    email: user.email,
    role: await roleNameFor(user.role),
  };
}
