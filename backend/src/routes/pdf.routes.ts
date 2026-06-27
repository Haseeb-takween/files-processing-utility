import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadFiles } from '../middleware/upload';
import * as pdfController from '../controllers/pdf.controller';

const router = Router();

// All tools share one dynamic route. Auth first, then upload, then dispatch.
router.post('/:tool', authenticate, uploadFiles, pdfController.process);

export default router;
