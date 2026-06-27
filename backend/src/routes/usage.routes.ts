import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as usageController from '../controllers/usage.controller';

const router = Router();

router.get('/me', authenticate, usageController.me);

export default router;
