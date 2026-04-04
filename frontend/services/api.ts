import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiResponse,
  Usuario,
  Partido,
  PartidoDetalle,
  Grupo,
  GrupoDetalle,
  Solicitud,
  HistorialItem,
  Amigo,
  SolicitudAmistad,
} from '../types';

const LOCAL_IP = '192.168.1.19';

const BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3000/api'
    : `http://${LOCAL_IP}:3000/api`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(
  username: string,
  contrasena: string
): Promise<ApiResponse<{ token: string; user: Usuario }>> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, contrasena }),
  });
}

export async function register(
  username: string,
  nombre: string,
  correo: string,
  contrasena: string,
  edad?: number,
  telefono?: number
): Promise<ApiResponse<{ token: string; user: Usuario }>> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, nombre, correo, contrasena, edad, telefono }),
  });
}

export async function googleAuth(
  idToken: string
): Promise<any> {
  return request('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

export async function googleComplete(data: {
  googleId: string;
  email: string;
  nombre: string;
  username: string;
}): Promise<ApiResponse<{ token: string; user: Usuario }>> {
  return request('/auth/google/complete', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Usuarios ────────────────────────────────────────────────────────────────

export async function getUsuario(id: number): Promise<ApiResponse<Usuario>> {
  return request(`/usuarios/${id}`);
}

export async function updateUsuario(
  id: number,
  data: Partial<Pick<Usuario, 'correo' | 'edad' | 'telefono' | 'descripcion'>>
): Promise<ApiResponse<Usuario>> {
  return request(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Partidos ────────────────────────────────────────────────────────────────

export async function getPartidos(filters?: {
  provincia?: string;
  municipio?: string;
  modalidad?: string;
  fecha?: string;
}): Promise<ApiResponse<Partido[]>> {
  const params = new URLSearchParams();
  if (filters?.provincia) params.append('provincia', filters.provincia);
  if (filters?.municipio) params.append('municipio', filters.municipio);
  if (filters?.modalidad) params.append('modalidad', filters.modalidad);
  if (filters?.fecha) params.append('fecha', filters.fecha);
  const query = params.toString();
  return request(`/partidos${query ? `?${query}` : ''}`);
}

export async function getPartido(
  id: number
): Promise<ApiResponse<PartidoDetalle>> {
  return request(`/partidos/${id}`);
}

export async function createPartido(data: {
  provincia: string;
  municipio: string;
  pista: string;
  modalidad: string;
  fecha: string;
  hora: string;
  huecos: number;
  latitud?: number;
  longitud?: number;
  id_grupo?: number;
}): Promise<ApiResponse<Partido>> {
  return request('/partidos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function inscribirse(
  partidoId: number
): Promise<{ message: string }> {
  return request(`/partidos/${partidoId}/inscribir`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function desinscribirse(
  partidoId: number
): Promise<{ message: string }> {
  return request(`/partidos/${partidoId}/inscribir`, {
    method: 'DELETE',
  });
}

// ─── Grupos ──────────────────────────────────────────────────────────────────

export async function getGrupos(): Promise<ApiResponse<Grupo[]>> {
  return request('/grupos');
}

export async function getGrupo(
  id: number
): Promise<ApiResponse<GrupoDetalle>> {
  return request(`/grupos/${id}`);
}

export async function createGrupo(
  nombre: string
): Promise<ApiResponse<Grupo>> {
  return request('/grupos', {
    method: 'POST',
    body: JSON.stringify({ nombre }),
  });
}

// ─── Solicitudes ─────────────────────────────────────────────────────────────

export async function enviarSolicitud(
  id_grupo: number
): Promise<ApiResponse<Solicitud>> {
  return request('/solicitudes', {
    method: 'POST',
    body: JSON.stringify({ id_grupo }),
  });
}

export async function getSolicitudesGrupo(
  grupoId: number
): Promise<ApiResponse<Solicitud[]>> {
  return request(`/solicitudes/grupo/${grupoId}`);
}

export async function responderSolicitud(
  id: number,
  estado: 'aceptada' | 'rechazada'
): Promise<{ message: string }> {
  return request(`/solicitudes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ estado }),
  });
}

// ─── Amigos ─────────────────────────────────────────────────────────────────

export async function getAmigos(): Promise<ApiResponse<Amigo[]>> {
  return request('/amigos');
}

export async function getSolicitudesAmistad(): Promise<ApiResponse<SolicitudAmistad[]>> {
  return request('/amigos/solicitudes');
}

export async function enviarSolicitudAmistad(
  username: string
): Promise<{ message: string }> {
  return request('/amigos/solicitud', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export async function responderSolicitudAmistad(
  id: number,
  estado: 'aceptada' | 'rechazada'
): Promise<{ message: string }> {
  return request(`/amigos/solicitud/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ estado }),
  });
}

export async function eliminarAmigo(
  id: number
): Promise<{ message: string }> {
  return request(`/amigos/${id}`, {
    method: 'DELETE',
  });
}

// ─── Historial ───────────────────────────────────────────────────────────────

export async function getHistorial(): Promise<ApiResponse<HistorialItem[]>> {
  return request('/historial');
}
