import { Router } from 'express';
import { getPartidos, getPartidoById, createPartido, inscribirse, desinscribirse } from '../controllers/partidos.controller';
import authMiddleware from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getPartidos);
router.get('/:id', authMiddleware, getPartidoById);
router.post('/', authMiddleware, createPartido);
router.post('/:id/inscribir', authMiddleware, inscribirse);
router.delete('/:id/inscribir', authMiddleware, desinscribirse);

export default router;
