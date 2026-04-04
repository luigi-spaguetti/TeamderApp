import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateToken(userId: number): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'teamder_secret_key_change_in_production',
    { expiresIn: '7d' }
  );
}

function sanitizeUser(user: RowDataPacket) {
  const { contrasena, google_id, ...safeUser } = user;
  return safeUser;
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, nombre, correo, contrasena } = req.body;

    if (!username || !nombre || !correo || !contrasena) {
      res.status(400).json({ error: 'Los campos username, nombre, correo y contraseña son obligatorios.' });
      return;
    }

    const [existingUsername] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM usuarios WHERE username = ?',
      [username]
    );
    if (existingUsername.length > 0) {
      res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
      return;
    }

    const [existingEmail] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );
    if (existingEmail.length > 0) {
      res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO usuarios (username, nombre, correo, contrasena) VALUES (?, ?, ?, ?)',
      [username, nombre, correo, hashedPassword]
    );

    const token = generateToken(result.insertId);

    res.status(201).json({
      message: 'Usuario registrado correctamente.',
      data: {
        token,
        user: {
          id: result.insertId,
          username,
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
    const { username, contrasena } = req.body;

    if (!username || !contrasena) {
      res.status(400).json({ error: 'Los campos username y contraseña son obligatorios.' });
      return;
    }

    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM usuarios WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      res.status(401).json({ error: 'Credenciales incorrectas.' });
      return;
    }

    const user = users[0];

    if (!user.contrasena) {
      res.status(401).json({ error: 'Esta cuenta usa Google para iniciar sesión.' });
      return;
    }

    const isMatch = await bcrypt.compare(contrasena, user.contrasena);
    if (!isMatch) {
      res.status(401).json({ error: 'Credenciales incorrectas.' });
      return;
    }

    const token = generateToken(user.id);

    res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      data: {
        token,
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ error: 'El token de Google es obligatorio.' });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: 'Token de Google inválido.' });
      return;
    }

    const { sub: googleId, email, name } = payload;

    // Check if user exists by google_id
    const [existingByGoogle] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM usuarios WHERE google_id = ?',
      [googleId]
    );

    if (existingByGoogle.length > 0) {
      const user = existingByGoogle[0];
      const token = generateToken(user.id);
      res.status(200).json({
        message: 'Inicio de sesión exitoso.',
        data: { token, user: sanitizeUser(user) }
      });
      return;
    }

    // Check if user exists by email
    const [existingByEmail] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM usuarios WHERE correo = ?',
      [email]
    );

    if (existingByEmail.length > 0) {
      // Link Google account to existing user
      const existingUser = existingByEmail[0];
      await pool.execute('UPDATE usuarios SET google_id = ? WHERE id = ?', [googleId, existingUser.id]);
      existingUser.google_id = googleId;
      const token = generateToken(existingUser.id);
      res.status(200).json({
        message: 'Cuenta vinculada con Google.',
        data: { token, user: sanitizeUser(existingUser) }
      });
      return;
    }

    // New user - needs username, return partial data
    res.status(202).json({
      message: 'Se necesita un nombre de usuario para completar el registro.',
      data: {
        needsUsername: true,
        googleId,
        email,
        name: name || '',
      }
    });
  } catch (error) {
    console.error('Error en googleAuth:', error);
    res.status(500).json({ error: 'Error al verificar el token de Google.' });
  }
};

export const googleComplete = async (req: Request, res: Response): Promise<void> => {
  try {
    const { googleId, email, nombre, username } = req.body;

    if (!googleId || !email || !nombre || !username) {
      res.status(400).json({ error: 'Todos los campos son obligatorios.' });
      return;
    }

    const [existingUsername] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM usuarios WHERE username = ?',
      [username]
    );
    if (existingUsername.length > 0) {
      res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO usuarios (username, nombre, correo, google_id) VALUES (?, ?, ?, ?)',
      [username, nombre, email, googleId]
    );

    const token = generateToken(result.insertId);

    res.status(201).json({
      message: 'Usuario registrado correctamente con Google.',
      data: {
        token,
        user: {
          id: result.insertId,
          username,
          nombre,
          correo: email,
          edad: null,
          telefono: null,
          descripcion: null
        }
      }
    });
  } catch (error) {
    console.error('Error en googleComplete:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
