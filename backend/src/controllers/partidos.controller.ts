import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const getPartidos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { municipio, modalidad, fecha } = req.query;

    let query = 'SELECT * FROM partidos WHERE (fecha > CURDATE() OR (fecha = CURDATE() AND hora >= CURTIME()))';
    const params: any[] = [];

    if (municipio) {
      query += ' AND municipio = ?';
      params.push(municipio);
    }

    if (modalidad) {
      query += ' AND modalidad = ?';
      params.push(modalidad);
    }

    if (fecha) {
      query += ' AND fecha = ?';
      params.push(fecha);
    }

    query += ' ORDER BY fecha ASC, hora ASC';

    const [partidos] = await pool.execute<RowDataPacket[]>(query, params);

    res.status(200).json({
      message: 'Partidos obtenidos correctamente.',
      data: partidos
    });
  } catch (error) {
    console.error('Error en getPartidos:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const getPartidoById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [partidos] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM partidos WHERE id = ?',
      [id]
    );

    if (partidos.length === 0) {
      res.status(404).json({ error: 'Partido no encontrado.' });
      return;
    }

    const [inscritos] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id, u.nombre, u.correo, u.edad, u.telefono, u.descripcion, up.equipo
       FROM usuario_partido up
       JOIN usuarios u ON up.id_usuario = u.id
       WHERE up.id_partido = ?`,
      [id]
    );

    res.status(200).json({
      message: 'Partido obtenido correctamente.',
      data: {
        ...partidos[0],
        inscritos
      }
    });
  } catch (error) {
    console.error('Error en getPartidoById:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const createPartido = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { municipio, pista, modalidad, fecha, hora, huecos, id_grupo } = req.body;

    if (!municipio || !pista || !modalidad || !fecha || !hora || !huecos) {
      res.status(400).json({ error: 'Los campos municipio, pista, modalidad, fecha, hora y huecos son obligatorios.' });
      return;
    }

    if (id_grupo) {
      const [membership] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM usuario_grupo WHERE id_grupo = ? AND id_usuario = ?',
        [id_grupo, req.userId!]
      );

      if (membership.length === 0) {
        res.status(403).json({ error: 'No eres miembro de este grupo.' });
        return;
      }
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO partidos (municipio, pista, modalidad, fecha, hora, huecos, huecos_inscritos, id_grupo) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
      [municipio, pista, modalidad, fecha, hora, huecos, id_grupo || null]
    );

    res.status(201).json({
      message: 'Partido creado correctamente.',
      data: {
        id: result.insertId,
        municipio,
        pista,
        modalidad,
        fecha,
        hora,
        huecos,
        huecos_inscritos: 0,
        id_grupo: id_grupo || null
      }
    });
  } catch (error) {
    console.error('Error en createPartido:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const inscribirse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { equipo } = req.body;

    const [partidos] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM partidos WHERE id = ?',
      [id]
    );

    if (partidos.length === 0) {
      res.status(404).json({ error: 'Partido no encontrado.' });
      return;
    }

    const partido = partidos[0];

    if (partido.huecos_inscritos >= partido.huecos) {
      res.status(400).json({ error: 'No hay huecos disponibles en este partido.' });
      return;
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM usuario_partido WHERE id_usuario = ? AND id_partido = ?',
      [req.userId!, id]
    );

    if (existing.length > 0) {
      res.status(400).json({ error: 'Ya estás inscrito en este partido.' });
      return;
    }

    await pool.execute(
      'INSERT INTO usuario_partido (id_usuario, id_partido, equipo) VALUES (?, ?, ?)',
      [req.userId!, id, equipo ?? null]
    );

    await pool.execute(
      'UPDATE partidos SET huecos_inscritos = huecos_inscritos + 1 WHERE id = ?',
      [id]
    );

    res.status(201).json({
      message: 'Inscripción realizada correctamente.'
    });
  } catch (error) {
    console.error('Error en inscribirse:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const desinscribirse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM usuario_partido WHERE id_usuario = ? AND id_partido = ?',
      [req.userId!, id]
    );

    if (existing.length === 0) {
      res.status(400).json({ error: 'No estás inscrito en este partido.' });
      return;
    }

    await pool.execute(
      'DELETE FROM usuario_partido WHERE id_usuario = ? AND id_partido = ?',
      [req.userId!, id]
    );

    await pool.execute(
      'UPDATE partidos SET huecos_inscritos = huecos_inscritos - 1 WHERE id = ?',
      [id]
    );

    res.status(200).json({
      message: 'Desinscripción realizada correctamente.'
    });
  } catch (error) {
    console.error('Error en desinscribirse:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
