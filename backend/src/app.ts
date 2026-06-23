import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import pdfRoutes from './routes/pdf.routes';
import usageRoutes from './routes/usage.routes';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFound } from './middleware/errorHandler';
import { handleMulterError } from './config/multer';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: false,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.use('/api/pdf', pdfRoutes);
app.use('/api/usage', usageRoutes);

app.use(notFound);
app.use(handleMulterError);
app.use(errorHandler);

export default app;
