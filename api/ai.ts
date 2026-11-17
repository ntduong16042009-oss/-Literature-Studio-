import express from 'express';
import { createApiRouter } from '../src/server/apiRouter';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/api', createApiRouter());
app.use('/', createApiRouter());

export default app;
