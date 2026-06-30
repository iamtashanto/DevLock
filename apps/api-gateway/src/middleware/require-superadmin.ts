import type { Request, Response, NextFunction } from 'express';
import { AuthenticationError, ForbiddenError } from '../core/errors/index.js';
import { UserModel } from '@devlock/database';

export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.sub) {
      throw new AuthenticationError('Authentication required');
    }

    const user = await UserModel.findById(req.auth.sub).lean();
    if (!user || !user.isSuperAdmin) {
      throw new ForbiddenError('Super admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};
