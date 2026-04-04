import { Router } from 'express';
import { getHistorial } from '../controllers/historial.controller';
import authMiddleware from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getHistorial);

export default router;
