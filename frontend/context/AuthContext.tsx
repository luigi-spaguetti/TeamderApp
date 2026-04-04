import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Usuario } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, contrasena: string) => Promise<void>;
  loginWithToken: (token: string, user: Usuario) => Promise<void>;
  register: (
    username: string,
    nombre: string,
    correo: string,
    contrasena: string,
    edad?: number,
    telefono?: number
  ) => Promise<void>;
  logout: () => void;
  updateUser: (user: Usuario) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const login = useCallback(async (username: string, contrasena: string) => {
    const response = await api.login(username, contrasena);
    const { token: newToken, user: newUser } = response.data;
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const loginWithToken = useCallback(async (newToken: string, newUser: Usuario) => {
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const register = useCallback(
    async (
      username: string,
      nombre: string,
      correo: string,
      contrasena: string,
      edad?: number,
      telefono?: number
    ) => {
      const response = await api.register(username, nombre, correo, contrasena, edad, telefono);
      const { token: newToken, user: newUser } = response.data;
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    },
    []
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updatedUser: Usuario) => {
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, loginWithToken, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
