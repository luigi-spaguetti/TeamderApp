import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GrupoDetalle, Solicitud } from '../../types';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import Colors from '../../constants/Colors';

export default function GrupoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [grupo, setGrupo] = useState<GrupoDetalle | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  async function loadGrupo() {
    try {
      const response = await api.getGrupo(Number(id));
      setGrupo(response.data);

      // Check if user is admin, then load solicitudes
      const currentMember = response.data.miembros?.find(
        (m) => m.id === user?.id
      );
      if (currentMember?.es_admin) {
        try {
          const solResponse = await api.getSolicitudesGrupo(Number(id));
          setSolicitudes(solResponse.data);
        } catch {
          // User might not have admin access, that is okay
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cargar el grupo.');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadGrupo();
  }, [id]);

  const isMember = grupo?.miembros?.some((m) => m.id === user?.id) ?? false;
  const isAdmin =
    grupo?.miembros?.find((m) => m.id === user?.id)?.es_admin ?? false;

  async function handleSolicitud() {
    setActionLoading(true);
    try {
      await api.enviarSolicitud(Number(id));
      Alert.alert(
        'Solicitud enviada',
        'Tu solicitud ha sido enviada al administrador del grupo.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar la solicitud.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResponderSolicitud(
    solicitudId: number,
    estado: 'aceptada' | 'rechazada'
  ) {
    setRespondingId(solicitudId);
    try {
      await api.responderSolicitud(solicitudId, estado);
      Alert.alert(
        'Solicitud procesada',
        `La solicitud ha sido ${estado}.`
      );
      await loadGrupo();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo procesar la solicitud.');
    } finally {
      setRespondingId(null);
    }
  }

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Grupo',
            headerStyle: { backgroundColor: Colors.primary },
            headerTintColor: Colors.white,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </>
    );
  }

  if (!grupo) return null;

  return (
    <>
      <Stack.Screen
        options={{
          title: grupo.nombre,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.groupIconContainer}>
              <Ionicons name="people" size={44} color={Colors.white} />
            </View>
            <Text style={styles.groupName}>{grupo.nombre}</Text>
            <Text style={styles.memberCount}>
              {grupo.miembros?.length ?? grupo.integrantes ?? 0}{' '}
              {(grupo.miembros?.length ?? 0) === 1 ? 'miembro' : 'miembros'}
            </Text>
          </View>

          {/* Members */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Miembros</Text>
            {grupo.miembros && grupo.miembros.length > 0 ? (
              grupo.miembros.map((miembro) => (
                <View key={miembro.id} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Ionicons name="person" size={16} color={Colors.white} />
                  </View>
                  <Text style={styles.memberName}>{miembro.nombre}</Text>
                  {miembro.es_admin && (
                    <View style={styles.adminBadge}>
                      <Ionicons name="shield" size={12} color={Colors.secondary} />
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                  {miembro.id === user?.id && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>Tú</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No hay miembros.</Text>
            )}
          </View>

          {/* Solicitudes (Admin only) */}
          {isAdmin && solicitudes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Solicitudes pendientes</Text>
              {solicitudes.map((solicitud) => (
                <View key={solicitud.id} style={styles.solicitudRow}>
                  <View style={styles.solicitudInfo}>
                    <View style={styles.memberAvatar}>
                      <Ionicons name="person" size={16} color={Colors.white} />
                    </View>
                    <View style={styles.solicitudTextContainer}>
                      <Text style={styles.solicitudName}>
                        {solicitud.nombre || `Usuario #${solicitud.id_usuario}`}
                      </Text>
                      {solicitud.correo && (
                        <Text style={styles.solicitudEmail}>
                          {solicitud.correo}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.solicitudActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() =>
                        handleResponderSolicitud(solicitud.id, 'aceptada')
                      }
                      disabled={respondingId === solicitud.id}
                    >
                      {respondingId === solicitud.id ? (
                        <ActivityIndicator color={Colors.white} size="small" />
                      ) : (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={Colors.white}
                        />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() =>
                        handleResponderSolicitud(solicitud.id, 'rechazada')
                      }
                      disabled={respondingId === solicitud.id}
                    >
                      <Ionicons name="close" size={20} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Join request button (non-members) */}
          {!isMember && (
            <View style={styles.joinSection}>
              <TouchableOpacity
                style={[
                  styles.joinButton,
                  actionLoading && styles.buttonDisabled,
                ]}
                onPress={handleSolicitud}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                {actionLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons
                      name="person-add-outline"
                      size={20}
                      color={Colors.white}
                    />
                    <Text style={styles.joinButtonText}>Solicitar unirse</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  groupIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  memberCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberName: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
  },
  adminBadgeText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '600',
    marginLeft: 3,
  },
  youBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  youBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  solicitudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  solicitudInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  solicitudTextContainer: {
    flex: 1,
  },
  solicitudName: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  solicitudEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  solicitudActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinSection: {
    padding: 16,
    marginTop: 8,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
