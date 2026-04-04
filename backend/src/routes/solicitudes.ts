import { Router } from 'express';
import { enviarSolicitud, getSolicitudesGrupo, responderSolicitud } from '../controllers/solicitudes.controller';
import authMiddleware from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, enviarSolicitud);
router.get('/grupo/:grupoId', authMiddleware, getSolicitudesGrupo);
router.put('/:id', authMiddleware, responderSolicitud);

export default router;
