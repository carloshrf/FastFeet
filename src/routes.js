import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import authMiddleware from './app/middlewares/auth';
import RecipientController from './app/controllers/RecipientController';
import DeliverymanController from './app/controllers/DeliverymanController';
import FileController from './app/controllers/FileController';
import OrderController from './app/controllers/OrderController';
import DeliverymanordersController from './app/controllers/DeliverymanordersController';
import DeliverymanfinishedordersController from './app/controllers/DeliverymanfinishedordersController';
import DeliveryProblemController from './app/controllers/DeliveryProblemController';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/sessions', SessionController.store);
routes.get('/deliveryman/:id/orders', DeliverymanordersController.index);
routes.get(
  '/deliveryman/:id/finishedorders',
  DeliverymanfinishedordersController.index
);
routes.put(
  '/deliveryman/:deliverymanid/orders/:orderid',
  DeliverymanordersController.update
);
routes.post('/delivery/:id/problems', DeliveryProblemController.store);
routes.get('/delivery/:id/problems', DeliveryProblemController.index);
routes.delete('/problem/:id/cancel-delivery', DeliveryProblemController.delete);

routes.use(authMiddleware);

routes.post('/deliveryman', DeliverymanController.store);
routes.get('/deliveryman', DeliverymanController.index);
routes.put('/deliveryman/:id', DeliverymanController.update);
routes.delete('/deliveryman/:id', DeliverymanController.delete);
routes.post('/files', upload.single('file'), FileController.store);
routes.post('/orders', OrderController.store);
routes.get('/orders', OrderController.index);
routes.delete('/orders/:id', OrderController.delete);
routes.put('/orders/:id', upload.single('file'), OrderController.update);
routes.post('/recipients', RecipientController.store);
routes.put('/recipients/:id', RecipientController.update);
routes.post('/users', UserController.store);

export default routes;
