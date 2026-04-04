export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  edad: number | null;
  telefono: number | null;
  descripcion: string | null;
}

export interface Grupo {
  id: number;
  nombre: string;
  integrantes: number | null;
  es_admin?: boolean;
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

export interface PartidoDetalle extends Partido {
  inscritos: UsuarioInscrito[];
}

export interface UsuarioInscrito {
  id: number;
  nombre: string;
  correo: string;
  edad: number | null;
  telefono: number | null;
  descripcion: string | null;
  equipo: boolean | null;
}

export interface GrupoDetalle extends Grupo {
  miembros: MiembroGrupo[];
}

export interface MiembroGrupo {
  id: number;
  nombre: string;
  correo: string;
  edad: number | null;
  telefono: number | null;
  descripcion: string | null;
  es_admin: boolean;
}

export interface Solicitud {
  id: number;
  id_grupo: number;
  id_usuario: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  nombre?: string;
  correo?: string;
  edad?: number | null;
  telefono?: number | null;
  descripcion?: string | null;
}

export interface HistorialItem {
  id: number;
  id_usuario: number;
  id_partido: number;
  municipio: string;
  pista: string;
  modalidad: string;
  fecha: string;
  hora: string;
  huecos: number;
  huecos_inscritos: number;
  id_grupo: number | null;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface ApiError {
  error: string;
}
