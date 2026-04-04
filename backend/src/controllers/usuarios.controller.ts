import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { RowDataPacket } from 'mysql2';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id, nombre, correo, edad, telefono, descripcion FROM usuarios WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    res.status(200).json({
      message: 'Perfil obtenido correctamente.',
      data: users[0]
    });
  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.userId !== Number(id)) {
      res.status(403).json({ error: 'No tienes permiso para editar este perfil.' });
      return;
    }

    const { correo, edad, telefono, descripcion } = req.body;

    await pool.execute(
      'UPDATE usuarios SET correo = COALESCE(?, correo), edad = COALESCE(?, edad), telefono = COALESCE(?, telefono), descripcion = COALESCE(?, descripcion) WHERE id = ?',
      [correo ?? null, edad ?? null, telefono ?? null, descripcion ?? null, id]
    );

    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id, nombre, correo, edad, telefono, descripcion FROM usuarios WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    res.status(200).json({
      message: 'Perfil actualizado correctamente.',
      data: users[0]
    });
  } catch (error) {
    console.error('Error en updateProfile:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
