import { Router, type Router as IRouter } from 'express';
import { ProjectController } from './project.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router: IRouter = Router({ mergeParams: true });
const controller = new ProjectController();

router.use(authenticate);

router.get('/', authorize('project:read'), (req, res, next) => {
  controller.list(req, res).catch(next);
});

router.post('/', authorize('project:create'), (req, res, next) => {
  controller.create(req, res).catch(next);
});

router.get('/:projectId', authorize('project:read'), (req, res, next) => {
  controller.getById(req, res).catch(next);
});

router.put('/:projectId', authorize('project:update'), (req, res, next) => {
  controller.update(req, res).catch(next);
});

router.delete('/:projectId', authorize('project:delete'), (req, res, next) => {
  controller.delete(req, res).catch(next);
});

export { router as projectRoutes };
