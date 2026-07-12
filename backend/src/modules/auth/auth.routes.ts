import { Router, type Router as IRouter } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { rateLimiter } from '../../middleware/rate-limiter.js';
import { RegisterSchema, LoginSchema, RefreshSchema } from './auth.validator.js';

const router: IRouter = Router();
const controller = new AuthController();

// Public routes (rate limited for brute force protection)
router.post('/register', rateLimiter('auth'), validate(RegisterSchema), (req, res, next) => {
  controller.register(req, res).catch(next);
});

router.post('/login', rateLimiter('auth'), validate(LoginSchema), (req, res, next) => {
  controller.login(req, res).catch(next);
});

router.post('/refresh', validate(RefreshSchema), (req, res, next) => {
  controller.refresh(req, res).catch(next);
});

router.post('/logout', (req, res, next) => {
  controller.logout(req, res).catch(next);
});

// Protected routes
router.get('/me', authenticate, (req, res, next) => {
  controller.me(req, res).catch(next);
});

router.patch('/me', authenticate, (req, res, next) => {
  controller.updateProfile(req, res).catch(next);
});

router.post('/change-password', authenticate, rateLimiter('auth'), (req, res, next) => {
  controller.changePassword(req, res).catch(next);
});

router.put('/tenant/branding', authenticate, (req, res, next) => {
  controller.updateTenantBranding(req, res).catch(next);
});

export { router as authRoutes };
