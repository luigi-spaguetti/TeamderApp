import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, correo, contrasena } = req.body;

    if (!nombre || !correo || !contrasena) {
      res.status(400).json({ error: 'Los campos nombre, correo y contrasena son obligatorios.' });
      return;
    }

    const [existingUsers] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM usuarios WHERE nombre = ?',
      [nombre]
    );

    if (existingUsers.length > 0) {
      res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO usuarios (nombre, correo, contrasena) VALUES (?, ?, ?)',
      [nombre, correo, hashedPassword]
    );

    const token = jwt.sign(
      { userId: result.insertId },
      process.env.JWT_SECRET || 'teamder_secret_key_change_in_production',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado correctamente.',
      data: {
        token,
        user: {
          id: result.insertId,
          nombre,
          correo,
          edad: null,
          telefono: null,
          descripcion: null
        }
      }
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, contrasena } = req.body;

    if (!nombre || !contrasena) {
      res.status(400).json({ error: 'Los campos nombre y contrasena son obligatorios.' });
      return;
    }

    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM usuarios WHERE nombre = ?',
      [nombre]
    );

    if (users.length === 0) {
      res.status(401).json({ error: 'Credenciales incorrectas.' });
      return;
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(contrasena, user.contrasena);

    if (!isMatch) {
      res.status(401).json({ error: 'Credenciales incorrectas.' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'teamder_secret_key_change_in_production',
      { expiresIn: '7d' }
    );

    const { contrasena: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      data: {
        token,
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
