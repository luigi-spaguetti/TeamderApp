import { Request } from 'express';

export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  correo: string;
  contrasena: string;
  google_id: string | null;
  edad: number | null;
  telefono: number | null;
  descripcion: string | null;
}

export interface Grupo {
  id: number;
  nombre: string;
  integrantes: number | null;
}

export interface Partido {
  id: number;
  municipio: string;
  pista: string;
  modalidad: string;
  fecha: string;
  hora: string;
  huecos: number;
  huecos_inscritos: number;
  id_grupo: number | null;
}

export interface UsuarioPartido {
  id: number;
  id_usuario: number;
  id_partido: number;
  equipo: boolean | null;
}

export interface UsuarioGrupo {
  id: number;
  id_grupo: number;
  id_usuario: number;
  es_admin: boolean;
}

export interface Solicitud {
  id: number;
  id_grupo: number;
  id_usuario: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
}

export interface Historial {
  id: number;
  id_usuario: number;
  id_partido: number;
}

export interface AuthRequest extends Request {
  userId?: number;
}
