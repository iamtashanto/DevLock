import { Router, type Router as IRouter } from 'express';
import { BillingController } from './billing.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router: IRouter = Router({ mergeParams: true });
const controller = new BillingController();

router.use(authenticate);

router.post('/manual-payment', authorize('org:manage_billing'), (req, res, next) => {
  controller.submitManualPayment(req, res).catch(next);
});

export { router as billingRoutes };
