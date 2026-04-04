import { Router } from 'express';
import { getGrupos, getGrupoById, createGrupo, getMiembros } from '../controllers/grupos.controller';
import authMiddleware from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getGrupos);
router.get('/:id', authMiddleware, getGrupoById);
router.post('/', authMiddleware, createGrupo);
router.get('/:id/miembros', authMiddleware, getMiembros);

export default router;
