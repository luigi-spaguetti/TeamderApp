import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import usuariosRoutes from './routes/usuarios';
import partidosRoutes from './routes/partidos';
import gruposRoutes from './routes/grupos';
import solicitudesRoutes from './routes/solicitudes';
import historialRoutes from './routes/historial';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/partidos', partidosRoutes);
app.use('/api/grupos', gruposRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/historial', historialRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'API de Teamder funcionando correctamente.' });
});

app.listen(PORT, () => {
  console.log(`Servidor de Teamder ejecutándose en el puerto ${PORT}`);
});
