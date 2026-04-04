import { Router } from 'express';
import { register, login, googleAuth, googleComplete } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/google/complete', googleComplete);

export default router;
