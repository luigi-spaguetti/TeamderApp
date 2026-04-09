import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const getPartidos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { provincia, municipio, modalidad, fecha } = req.query;

    // Show public partidos (no group associations) + partidos shared with user's groups
    let query = `SELECT DISTINCT p.* FROM partidos p
      LEFT JOIN partido_grupo pg ON p.id = pg.id_partido
      WHERE (p.fecha > CURDATE() OR (p.fecha = CURDATE() AND p.hora >= CURTIME()))
      AND (
        (pg.id_partido IS NULL AND p.id_grupo IS NULL)
        OR pg.id_grupo IN (SELECT id_grupo FROM usuario_grupo WHERE id_usuario = ?)
        OR p.id_grupo IN (SELECT id_grupo FROM usuario_grupo WHERE id_usuario = ?)
      )`;
    const params: any[] = [req.userId!, req.userId!];

    if (provincia) {
      query += ' AND p.provincia = ?';
      params.push(provincia);
    }

    if (municipio) {
      query += ' AND p.municipio = ?';
      params.push(municipio);
    }

    if (modalidad) {
      query += ' AND p.modalidad = ?';
      params.push(modalidad);
    }

    if (fecha) {
      query += ' AND p.fecha = ?';
      params.push(fecha);
    }

    query += ' ORDER BY p.fecha ASC, p.hora ASC';

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
    const { provincia, municipio, pista, modalidad, fecha, hora, huecos, latitud, longitud, grupo_ids } = req.body;

    if (!provincia || !municipio || !pista || !modalidad || !fecha || !hora || !huecos) {
      res.status(400).json({ error: 'Los campos provincia, municipio, pista, modalidad, fecha, hora y huecos son obligatorios.' });
      return;
    }

    // Validate group membership for all selected groups
    const grupoIds: number[] = Array.isArray(grupo_ids) ? grupo_ids : [];
    if (grupoIds.length > 0) {
      const placeholders = grupoIds.map(() => '?').join(',');
      const [membership] = await pool.execute<RowDataPacket[]>(
        `SELECT id_grupo FROM usuario_grupo WHERE id_usuario = ? AND id_grupo IN (${placeholders})`,
        [req.userId!, ...grupoIds]
      );
      if (membership.length !== grupoIds.length) {
        res.status(403).json({ error: 'No eres miembro de todos los grupos seleccionados.' });
        return;
      }
    }

    // Keep id_grupo as first group for backward compat
    const idGrupo = grupoIds.length > 0 ? grupoIds[0] : null;

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO partidos (provincia, municipio, pista, modalidad, fecha, hora, huecos, huecos_inscritos, latitud, longitud, id_grupo) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)',
      [provincia, municipio, pista, modalidad, fecha, hora, huecos, latitud || null, longitud || null, idGrupo]
    );

    // Insert into partido_grupo for each selected group
    for (const gId of grupoIds) {
      await pool.execute(
        'INSERT INTO partido_grupo (id_partido, id_grupo) VALUES (?, ?)',
        [result.insertId, gId]
      );
    }

    res.status(201).json({
      message: 'Partido creado correctamente.',
      data: {
        id: result.insertId,
        provincia,
        municipio,
        pista,
        modalidad,
        fecha,
        hora,
        huecos,
        huecos_inscritos: 0,
        latitud: latitud || null,
        longitud: longitud || null,
        id_grupo: idGrupo,
        grupo_ids: grupoIds
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
