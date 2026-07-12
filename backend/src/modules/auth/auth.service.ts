import { createHash, randomBytes } from 'crypto';
import { hashPassword, verifyPassword } from '@/encryption';
import { UserModel, TenantModel } from '@/database';
import { TokenService } from '../../core/auth/token-service.js';
import { getPermissionsForRole, type Role } from '../../core/auth/permissions.js';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '../../core/errors/index.js';

const tokenService = new TokenService();

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  organizationName: string;
}

export interface LoginInput {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  /**
   * Register a new user and create their organization.
   */
  async register(input: RegisterInput): Promise<AuthTokens> {
    // Check if email already exists
    const existing = await UserModel.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create organization first (user needs tenantId)
    const slug = this.generateSlug(input.organizationName);
    const org = await TenantModel.create({
      name: input.organizationName,
      slug,
      plan: 'free',
      owner: null, // Will update after user creation
      settings: {},
      billing: {},
    });

    // Create user with tenantId
    const user = await UserModel.create({
      tenantId: org._id,
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash,
      role: 'owner',
      mfa: { enabled: false },
    });

    // Update org owner
    org.owner = user._id;
    await org.save();

    // Generate tokens
    return this.generateTokens(user._id.toString(), org._id.toString(), 'owner');
  }

  /**
   * Authenticate user with email/password.
   */
  async login(input: LoginInput, ip: string, userAgent: string): Promise<AuthTokens> {
    // Find user with password
    const user = await UserModel.findOne({ email: input.email.toLowerCase() })
      .select('+passwordHash')
      .lean();

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // TODO: Check MFA if enabled
    if (user.mfa?.enabled && !input.mfaCode) {
      throw new AuthenticationError('MFA code required');
    }

    // Update last login
    await UserModel.updateOne(
      { _id: user._id },
      { lastLoginAt: new Date() },
    );

    return this.generateTokens(
      user._id.toString(),
      user.tenantId.toString(),
      user.role as Role,
    );
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    // Hash the refresh token to look it up
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    // TODO: Look up in sessions collection, validate, rotate
    // For now, simplified implementation
    throw new AuthenticationError('Invalid refresh token');
  }

  /**
   * Invalidate a refresh token (logout).
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    // TODO: Delete from sessions collection
  }

  /**
   * Update the current user's profile (currently: display name).
   */
  async updateProfile(userId: string, input: { name?: string }): Promise<{ id: string; name: string; email: string; role: string }> {
    const update: Record<string, unknown> = {};
    if (typeof input.name === 'string' && input.name.trim()) update['name'] = input.name.trim();

    const user = await UserModel.findByIdAndUpdate(userId, update, { new: true }).lean();
    if (!user) throw new NotFoundError('User not found');

    return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
  }

  /**
   * Change the current user's password after verifying the current one.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 8) {
      throw new AuthenticationError('New password must be at least 8 characters');
    }

    const user = await UserModel.findById(userId).select('+passwordHash');
    if (!user) throw new NotFoundError('User not found');

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw new AuthenticationError('Current password is incorrect');

    user.passwordHash = await hashPassword(newPassword);
    await user.save();
  }

  // ── Private ──────────────────────────────────────────────────────────

  private generateTokens(userId: string, orgId: string, role: Role): AuthTokens {
    const permissions = getPermissionsForRole(role);

    const accessToken = tokenService.generateAccessToken({
      sub: userId,
      orgId,
      role,
      permissions,
    });

    const refreshToken = tokenService.generateRefreshToken();

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = randomBytes(3).toString('hex');
    return `${base}-${suffix}`;
  }
}
