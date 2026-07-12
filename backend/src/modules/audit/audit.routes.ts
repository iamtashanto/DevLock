import { Router, type Router as IRouter } from 'express';
import { AuditController } from './audit.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router: IRouter = Router({ mergeParams: true });
const controller = new AuditController();

router.use(authenticate);

router.get('/', (req, res, next) => {
  controller.list(req, res).catch(next);
});

export { router as auditRoutes };
