import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/usuarios.controller';
import authMiddleware from '../middleware/auth';

const router = Router();

router.get('/:id', authMiddleware, getProfile);
router.put('/:id', authMiddleware, updateProfile);

export default router;
