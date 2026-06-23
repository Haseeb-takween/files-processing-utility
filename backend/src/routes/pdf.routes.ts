import { Router } from 'express';
import * as pdfController from '../controllers/pdf.controller';
import { authenticate } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(uploadLimiter);

router.get('/tools', pdfController.getTools);
router.post('/merge', pdfController.merge);
router.post('/split', pdfController.split);
router.post('/compress', pdfController.compress);
router.post('/convert', pdfController.convert);
router.post('/pages', pdfController.pages);
router.post('/watermark', pdfController.watermark);

export default router;
