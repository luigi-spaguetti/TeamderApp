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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Grupo } from '../../types';
import * as api from '../../services/api';
import GrupoCard from '../../components/GrupoCard';
import Colors from '../../constants/Colors';

export default function GruposScreen() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [creating, setCreating] = useState(false);

  const loadGrupos = useCallback(async () => {
    try {
      const response = await api.getGrupos();
      setGrupos(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron cargar los grupos.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadGrupos().finally(() => setLoading(false));
    }, [loadGrupos])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadGrupos();
    setRefreshing(false);
  }

  async function handleCreate() {
    if (!newNombre.trim()) {
      Alert.alert('Error', 'El nombre del grupo es obligatorio.');
      return;
    }

    setCreating(true);
    try {
      await api.createGrupo(newNombre.trim());
      Alert.alert('Grupo creado', 'El grupo se ha creado correctamente.');
      setShowCreateModal(false);
      setNewNombre('');
      await loadGrupos();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear el grupo.');
    } finally {
      setCreating(false);
    }
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color={Colors.border} />
        <Text style={styles.emptyTitle}>Sin grupos</Text>
        <Text style={styles.emptySubtitle}>
          No perteneces a ningún grupo todavía. Crea uno o únete desde la página de detalle de un grupo.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={grupos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <GrupoCard grupo={item} />}
          contentContainerStyle={
            grupos.length === 0 ? styles.emptyList : styles.listContent
          }
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo grupo</Text>

            <Text style={styles.fieldLabel}>Nombre del grupo</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Amigos CF"
              placeholderTextColor={Colors.textSecondary}
              value={newNombre}
              onChangeText={setNewNombre}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewNombre('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, creating && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={creating}
                activeOpacity={0.8}
              >
                {creating ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.createButtonText}>Crear</Text>
                )}
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
