import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const getGrupos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [grupos] = await pool.execute<RowDataPacket[]>(
      `SELECT g.*, ug.es_admin
       FROM grupos g
       JOIN usuario_grupo ug ON g.id = ug.id_grupo
       WHERE ug.id_usuario = ?`,
      [req.userId!]
    );

    res.status(200).json({
      message: 'Grupos obtenidos correctamente.',
      data: grupos
    });
  } catch (error) {
    console.error('Error en getGrupos:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const getGrupoById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [grupos] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM grupos WHERE id = ?',
      [id]
    );

    if (grupos.length === 0) {
      res.status(404).json({ error: 'Grupo no encontrado.' });
      return;
    }

    const [miembros] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id, u.nombre, u.correo, u.edad, u.telefono, u.descripcion, ug.es_admin
       FROM usuario_grupo ug
       JOIN usuarios u ON ug.id_usuario = u.id
       WHERE ug.id_grupo = ?`,
      [id]
    );

    res.status(200).json({
      message: 'Grupo obtenido correctamente.',
      data: {
        ...grupos[0],
        miembros
      }
    });
  } catch (error) {
    console.error('Error en getGrupoById:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const createGrupo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      res.status(400).json({ error: 'El campo nombre es obligatorio.' });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO grupos (nombre, integrantes) VALUES (?, 1)',
      [nombre]
    );

    await pool.execute(
      'INSERT INTO usuario_grupo (id_grupo, id_usuario, es_admin) VALUES (?, ?, true)',
      [result.insertId, req.userId!]
    );

    res.status(201).json({
      message: 'Grupo creado correctamente.',
      data: {
        id: result.insertId,
        nombre,
        integrantes: 1
      }
    });
  } catch (error) {
    console.error('Error en createGrupo:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const getMiembros = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [grupos] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM grupos WHERE id = ?',
      [id]
    );

    if (grupos.length === 0) {
      res.status(404).json({ error: 'Grupo no encontrado.' });
      return;
    }

    const [miembros] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id, u.nombre, u.correo, u.edad, u.telefono, u.descripcion, ug.es_admin
       FROM usuario_grupo ug
       JOIN usuarios u ON ug.id_usuario = u.id
       WHERE ug.id_grupo = ?`,
      [id]
    );

    res.status(200).json({
      message: 'Miembros obtenidos correctamente.',
      data: miembros
    });
  } catch (error) {
    console.error('Error en getMiembros:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
