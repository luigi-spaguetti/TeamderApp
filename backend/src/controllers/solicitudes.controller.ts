import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const enviarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id_grupo } = req.body;

    if (!id_grupo) {
      res.status(400).json({ error: 'El campo id_grupo es obligatorio.' });
      return;
    }

    const [grupos] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM grupos WHERE id = ?',
      [id_grupo]
    );

    if (grupos.length === 0) {
      res.status(404).json({ error: 'Grupo no encontrado.' });
      return;
    }

    const [membership] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM usuario_grupo WHERE id_grupo = ? AND id_usuario = ?',
      [id_grupo, req.userId!]
    );

    if (membership.length > 0) {
      res.status(400).json({ error: 'Ya eres miembro de este grupo.' });
      return;
    }

    const [pendingSolicitud] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM solicitudes WHERE id_grupo = ? AND id_usuario = ? AND estado = 'pendiente'",
      [id_grupo, req.userId!]
    );

    if (pendingSolicitud.length > 0) {
      res.status(400).json({ error: 'Ya tienes una solicitud pendiente para este grupo.' });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO solicitudes (id_grupo, id_usuario, estado) VALUES (?, ?, ?)',
      [id_grupo, req.userId!, 'pendiente']
    );

    res.status(201).json({
      message: 'Solicitud enviada correctamente.',
      data: {
        id: result.insertId,
        id_grupo,
        id_usuario: req.userId,
        estado: 'pendiente'
      }
    });
  } catch (error) {
    console.error('Error en enviarSolicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const getSolicitudesGrupo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { grupoId } = req.params;

    const [adminCheck] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM usuario_grupo WHERE id_grupo = ? AND id_usuario = ? AND es_admin = true',
      [grupoId, req.userId!]
    );

    if (adminCheck.length === 0) {
      res.status(403).json({ error: 'No tienes permisos de administrador en este grupo.' });
      return;
    }

    const [solicitudes] = await pool.execute<RowDataPacket[]>(
      `SELECT s.*, u.nombre, u.correo, u.edad, u.telefono, u.descripcion
       FROM solicitudes s
       JOIN usuarios u ON s.id_usuario = u.id
       WHERE s.id_grupo = ? AND s.estado = 'pendiente'`,
      [grupoId]
    );

    res.status(200).json({
      message: 'Solicitudes obtenidas correctamente.',
      data: solicitudes
    });
  } catch (error) {
    console.error('Error en getSolicitudesGrupo:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const responderSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || (estado !== 'aceptada' && estado !== 'rechazada')) {
      res.status(400).json({ error: 'El estado debe ser "aceptada" o "rechazada".' });
      return;
    }

    const [solicitudes] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM solicitudes WHERE id = ?',
      [id]
    );

    if (solicitudes.length === 0) {
      res.status(404).json({ error: 'Solicitud no encontrada.' });
      return;
    }

    const solicitud = solicitudes[0];

    if (solicitud.estado !== 'pendiente') {
      res.status(400).json({ error: 'Esta solicitud ya ha sido procesada.' });
      return;
    }

    const [adminCheck] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM usuario_grupo WHERE id_grupo = ? AND id_usuario = ? AND es_admin = true',
      [solicitud.id_grupo, req.userId!]
    );

    if (adminCheck.length === 0) {
      res.status(403).json({ error: 'No tienes permisos de administrador en este grupo.' });
      return;
    }

    await pool.execute(
      'UPDATE solicitudes SET estado = ? WHERE id = ?',
      [estado, id]
    );

    if (estado === 'aceptada') {
      await pool.execute(
        'INSERT INTO usuario_grupo (id_grupo, id_usuario, es_admin) VALUES (?, ?, false)',
        [solicitud.id_grupo, solicitud.id_usuario]
      );

      await pool.execute(
        'UPDATE grupos SET integrantes = COALESCE(integrantes, 0) + 1 WHERE id = ?',
        [solicitud.id_grupo]
      );
    }

    res.status(200).json({
      message: `Solicitud ${estado} correctamente.`
    });
  } catch (error) {
    console.error('Error en responderSolicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
