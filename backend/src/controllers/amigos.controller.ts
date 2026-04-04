import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const getAmigos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const [amigos] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id, u.username, u.nombre, u.correo, u.edad, u.telefono, u.descripcion
       FROM amistades a
       JOIN usuarios u ON (u.id = CASE WHEN a.id_usuario1 = ? THEN a.id_usuario2 ELSE a.id_usuario1 END)
       WHERE (a.id_usuario1 = ? OR a.id_usuario2 = ?) AND a.estado = 'aceptada'`,
      [userId, userId, userId]
    );

    res.status(200).json({
      message: 'Amigos obtenidos correctamente.',
      data: amigos
    });
  } catch (error) {
    console.error('Error en getAmigos:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const getSolicitudesAmistad = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const [solicitudes] = await pool.execute<RowDataPacket[]>(
      `SELECT a.id, u.id as id_usuario, u.username, u.nombre, u.correo, u.edad, u.telefono, u.descripcion
       FROM amistades a
       JOIN usuarios u ON u.id = a.id_usuario1
       WHERE a.id_usuario2 = ? AND a.estado = 'pendiente'`,
      [userId]
    );

    res.status(200).json({
      message: 'Solicitudes de amistad obtenidas correctamente.',
      data: solicitudes
    });
  } catch (error) {
    console.error('Error en getSolicitudesAmistad:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const enviarSolicitudAmistad = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { username } = req.body;

    if (!username) {
      res.status(400).json({ error: 'El nombre de usuario es obligatorio.' });
      return;
    }

    const [usuarios] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM usuarios WHERE username = ?',
      [username]
    );

    if (usuarios.length === 0) {
      res.status(404).json({ error: 'No se encontró un usuario con ese nombre de usuario.' });
      return;
    }

    const targetId = usuarios[0].id;

    if (targetId === userId) {
      res.status(400).json({ error: 'No puedes enviarte una solicitud a ti mismo.' });
      return;
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
      `SELECT id, estado FROM amistades
       WHERE (id_usuario1 = ? AND id_usuario2 = ?) OR (id_usuario1 = ? AND id_usuario2 = ?)`,
      [userId, targetId, targetId, userId]
    );

    if (existing.length > 0) {
      const amistad = existing[0];
      if (amistad.estado === 'aceptada') {
        res.status(400).json({ error: 'Ya sois amigos.' });
      } else if (amistad.estado === 'pendiente') {
        res.status(400).json({ error: 'Ya existe una solicitud pendiente.' });
      } else {
        await pool.execute(
          'UPDATE amistades SET estado = ?, id_usuario1 = ?, id_usuario2 = ? WHERE id = ?',
          ['pendiente', userId, targetId, amistad.id]
        );
        res.status(200).json({ message: 'Solicitud de amistad reenviada.' });
      }
      return;
    }

    await pool.execute(
      'INSERT INTO amistades (id_usuario1, id_usuario2, estado) VALUES (?, ?, ?)',
      [userId, targetId, 'pendiente']
    );

    res.status(201).json({ message: 'Solicitud de amistad enviada.' });
  } catch (error) {
    console.error('Error en enviarSolicitudAmistad:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const responderSolicitudAmistad = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || (estado !== 'aceptada' && estado !== 'rechazada')) {
      res.status(400).json({ error: 'El estado debe ser "aceptada" o "rechazada".' });
      return;
    }

    const [amistades] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM amistades WHERE id = ? AND id_usuario2 = ? AND estado = ?',
      [id, userId, 'pendiente']
    );

    if (amistades.length === 0) {
      res.status(404).json({ error: 'Solicitud no encontrada.' });
      return;
    }

    await pool.execute(
      'UPDATE amistades SET estado = ? WHERE id = ?',
      [estado, id]
    );

    res.status(200).json({ message: `Solicitud ${estado}.` });
  } catch (error) {
    console.error('Error en responderSolicitudAmistad:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const eliminarAmigo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await pool.execute(
      `DELETE FROM amistades
       WHERE ((id_usuario1 = ? AND id_usuario2 = ?) OR (id_usuario1 = ? AND id_usuario2 = ?)) AND estado = 'aceptada'`,
      [userId, id, id, userId]
    );

    res.status(200).json({ message: 'Amigo eliminado correctamente.' });
  } catch (error) {
    console.error('Error en eliminarAmigo:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
