import { Router } from 'express';
import { getAmigos, getSolicitudesAmistad, enviarSolicitudAmistad, responderSolicitudAmistad, eliminarAmigo } from '../controllers/amigos.controller';
import authMiddleware from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getAmigos);
router.get('/solicitudes', getSolicitudesAmistad);
router.post('/solicitud', enviarSolicitudAmistad);
router.put('/solicitud/:id', responderSolicitudAmistad);
router.delete('/:id', eliminarAmigo);

export default router;
