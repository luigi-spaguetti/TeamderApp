import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Grupo, Amigo, SolicitudAmistad } from '../../types';
import * as api from '../../services/api';
import GrupoCard from '../../components/GrupoCard';
import Colors from '../../constants/Colors';

type SubTab = 'amigos' | 'grupos';

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState<SubTab>('amigos');

  // Grupos state
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [refreshingGrupos, setRefreshingGrupos] = useState(false);
  const [showCreateGrupo, setShowCreateGrupo] = useState(false);
  const [newNombreGrupo, setNewNombreGrupo] = useState('');
  const [creatingGrupo, setCreatingGrupo] = useState(false);

  // Amigos state
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudAmistad[]>([]);
  const [loadingAmigos, setLoadingAmigos] = useState(true);
  const [refreshingAmigos, setRefreshingAmigos] = useState(false);
  const [showAddAmigo, setShowAddAmigo] = useState(false);
  const [usernameAmigo, setUsernameAmigo] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  // ─── Load data ──────────────────────────────────────────────────────────
  const loadGrupos = useCallback(async () => {
    try {
      const response = await api.getGrupos();
      setGrupos(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron cargar los grupos.');
    }
  }, []);

  const loadAmigos = useCallback(async () => {
    try {
      const [amigosRes, solicitudesRes] = await Promise.all([
        api.getAmigos(),
        api.getSolicitudesAmistad(),
      ]);
      setAmigos(amigosRes.data);
      setSolicitudes(solicitudesRes.data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron cargar los amigos.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoadingGrupos(true);
      setLoadingAmigos(true);
      loadGrupos().finally(() => setLoadingGrupos(false));
      loadAmigos().finally(() => setLoadingAmigos(false));
    }, [loadGrupos, loadAmigos])
  );

  // ─── Grupos handlers ───────────────────────────────────────────────────
  async function handleRefreshGrupos() {
    setRefreshingGrupos(true);
    await loadGrupos();
    setRefreshingGrupos(false);
  }

  async function handleCreateGrupo() {
    if (!newNombreGrupo.trim()) {
      Alert.alert('Error', 'El nombre del grupo es obligatorio.');
      return;
    }
    setCreatingGrupo(true);
    try {
      await api.createGrupo(newNombreGrupo.trim());
      Alert.alert('Grupo creado', 'El grupo se ha creado correctamente.');
      setShowCreateGrupo(false);
      setNewNombreGrupo('');
      await loadGrupos();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear el grupo.');
    } finally {
      setCreatingGrupo(false);
    }
  }

  // ─── Amigos handlers ──────────────────────────────────────────────────
  async function handleRefreshAmigos() {
    setRefreshingAmigos(true);
    await loadAmigos();
    setRefreshingAmigos(false);
  }

  async function handleAddAmigo() {
    if (!usernameAmigo.trim()) {
      Alert.alert('Error', 'El nombre de usuario es obligatorio.');
      return;
    }
    setSendingRequest(true);
    try {
      const res = await api.enviarSolicitudAmistad(usernameAmigo.trim());
      Alert.alert('Enviada', res.message);
      setShowAddAmigo(false);
      setUsernameAmigo('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar la solicitud.');
    } finally {
      setSendingRequest(false);
    }
  }

  async function handleResponderSolicitud(id: number, estado: 'aceptada' | 'rechazada') {
    try {
      await api.responderSolicitudAmistad(id, estado);
      await loadAmigos();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  async function handleEliminarAmigo(amigo: Amigo) {
    const doDelete = async () => {
      try {
        await api.eliminarAmigo(amigo.id);
        await loadAmigos();
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Eliminar a ${amigo.nombre} de tus amigos?`)) {
        await doDelete();
      }
    } else {
      Alert.alert('Eliminar amigo', `¿Eliminar a ${amigo.nombre} de tus amigos?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: doDelete },
      ]);
    }
  }

  // ─── Render helpers ─────────────────────────────────────────────────────
  function renderGruposContent() {
    if (loadingGrupos) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }
    return (
      <FlatList
        data={grupos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <GrupoCard grupo={item} />}
        contentContainerStyle={grupos.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>Sin grupos</Text>
            <Text style={styles.emptySubtitle}>
              No perteneces a ningún grupo todavía.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshingGrupos} onRefresh={handleRefreshGrupos} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
      />
    );
  }

  function renderAmigosContent() {
    if (loadingAmigos) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    const data = [
      ...solicitudes.map((s) => ({ type: 'solicitud' as const, data: s })),
      ...amigos.map((a) => ({ type: 'amigo' as const, data: a })),
    ];

    return (
      <FlatList
        data={data}
        keyExtractor={(item) =>
          item.type === 'solicitud' ? `sol-${item.data.id}` : `ami-${item.data.id}`
        }
        renderItem={({ item }) => {
          if (item.type === 'solicitud') {
            const sol = item.data as SolicitudAmistad;
            return (
              <View style={styles.solicitudCard}>
                <View style={styles.solicitudBadge}>
                  <Text style={styles.solicitudBadgeText}>Solicitud</Text>
                </View>
                <View style={styles.amigoInfo}>
                  <View style={styles.amigoIconContainer}>
                    <Ionicons name="person-add-outline" size={24} color={Colors.secondary} />
                  </View>
                  <View style={styles.amigoTextContainer}>
                    <Text style={styles.amigoNombre}>{sol.nombre}</Text>
                    <Text style={styles.amigoUsername}>@{sol.username}</Text>
                  </View>
                </View>
                <View style={styles.solicitudButtons}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleResponderSolicitud(sol.id, 'aceptada')}
                  >
                    <Ionicons name="checkmark" size={20} color={Colors.white} />
                    <Text style={styles.acceptButtonText}>Aceptar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleResponderSolicitud(sol.id, 'rechazada')}
                  >
                    <Ionicons name="close" size={20} color={Colors.danger} />
                    <Text style={styles.rejectButtonText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          const amigo = item.data as Amigo;
          return (
            <View style={styles.amigoCard}>
              <View style={styles.amigoInfo}>
                <View style={styles.amigoIconContainer}>
                  <Ionicons name="person-outline" size={24} color={Colors.primary} />
                </View>
                <View style={styles.amigoTextContainer}>
                  <Text style={styles.amigoNombre}>{amigo.nombre}</Text>
                  <Text style={styles.amigoUsername}>@{amigo.username}</Text>
                  {amigo.edad && (
                    <Text style={styles.amigoDetalle}>{amigo.edad} años</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteAmigoButton}
                onPress={() => handleEliminarAmigo(amigo)}
              >
                <Ionicons name="person-remove-outline" size={20} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          );
        }}
        contentContainerStyle={data.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>Sin amigos</Text>
            <Text style={styles.emptySubtitle}>
              Añade amigos usando su correo electrónico.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshingAmigos} onRefresh={handleRefreshAmigos} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Top sub-tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'amigos' && styles.tabActive]}
          onPress={() => setActiveTab('amigos')}
        >
          <Ionicons
            name="heart-outline"
            size={18}
            color={activeTab === 'amigos' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'amigos' && styles.tabTextActive]}>
            Amigos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'grupos' && styles.tabActive]}
          onPress={() => setActiveTab('grupos')}
        >
          <Ionicons
            name="people-outline"
            size={18}
            color={activeTab === 'grupos' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'grupos' && styles.tabTextActive]}>
            Grupos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'amigos' ? renderAmigosContent() : renderGruposContent()}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (activeTab === 'amigos') setShowAddAmigo(true);
          else setShowCreateGrupo(true);
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Create Grupo Modal */}
      <Modal visible={showCreateGrupo} animationType="fade" transparent onRequestClose={() => setShowCreateGrupo(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo grupo</Text>
            <Text style={styles.fieldLabel}>Nombre del grupo</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Amigos CF"
              placeholderTextColor={Colors.textSecondary}
              value={newNombreGrupo}
              onChangeText={setNewNombreGrupo}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowCreateGrupo(false); setNewNombreGrupo(''); }}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, creatingGrupo && styles.buttonDisabled]}
                onPress={handleCreateGrupo}
                disabled={creatingGrupo}
              >
                {creatingGrupo ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.createButtonText}>Crear</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Amigo Modal */}
      <Modal visible={showAddAmigo} animationType="fade" transparent onRequestClose={() => setShowAddAmigo(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Añadir amigo</Text>
            <Text style={styles.fieldLabel}>Nombre de usuario</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: juanito"
              placeholderTextColor={Colors.textSecondary}
              value={usernameAmigo}
              onChangeText={setUsernameAmigo}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowAddAmigo(false); setUsernameAmigo(''); }}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, sendingRequest && styles.buttonDisabled]}
                onPress={handleAddAmigo}
                disabled={sendingRequest}
              >
                {sendingRequest ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.createButtonText}>Enviar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  // Amigo cards
  amigoCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  solicitudCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  solicitudBadge: {
    backgroundColor: Colors.secondary + '20',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
  },
  solicitudBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  amigoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  amigoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  amigoTextContainer: {
    flex: 1,
  },
  amigoNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  amigoUsername: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  amigoDetalle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteAmigoButton: {
    padding: 8,
  },
  solicitudButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 4,
  },
  acceptButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 4,
  },
  rejectButtonText: {
    color: Colors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
