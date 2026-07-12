import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const tokens = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: tokens,
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const tokens = await authService.login(
      req.body,
      req.ip ?? 'unknown',
      req.headers['user-agent'] ?? 'unknown',
    );

    res.json({
      success: true,
      data: tokens,
    });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const tokens = await authService.refresh(req.body.refreshToken);

    res.json({
      success: true,
      data: tokens,
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    await authService.logout(req.body.refreshToken);

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  }

  async me(req: Request, res: Response): Promise<void> {
    const { UserModel } = await import('@/database');
    const user = await UserModel.findById(req.auth!.sub).lean();

    res.json({
      success: true,
      data: {
        userId: req.auth!.sub,
        orgId: req.auth!.orgId,
        role: req.auth!.role,
        permissions: req.auth!.permissions,
        isSuperAdmin: user?.isSuperAdmin || false,
        name: user?.name,
        email: user?.email,
      },
    });
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    const data = await authService.updateProfile(req.auth!.sub, req.body);
    res.json({ success: true, data });
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    await authService.changePassword(req.auth!.sub, req.body.currentPassword, req.body.newPassword);
    res.json({ success: true, data: { message: 'Password changed successfully' } });
  }
}
