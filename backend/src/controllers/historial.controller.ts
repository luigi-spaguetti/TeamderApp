import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { RowDataPacket } from 'mysql2';

export const getHistorial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [historial] = await pool.execute<RowDataPacket[]>(
      `SELECT h.id, h.id_usuario, h.id_partido,
              p.municipio, p.pista, p.modalidad, p.fecha, p.hora, p.huecos, p.huecos_inscritos, p.id_grupo
       FROM historial h
       JOIN partidos p ON h.id_partido = p.id
       WHERE h.id_usuario = ?
       ORDER BY p.fecha DESC, p.hora DESC`,
      [req.userId!]
    );

    res.status(200).json({
      message: 'Historial obtenido correctamente.',
      data: historial
    });
  } catch (error) {
    console.error('Error en getHistorial:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
