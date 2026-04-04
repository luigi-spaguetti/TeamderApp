import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Partido } from '../../types';
import * as api from '../../services/api';
import PartidoCard from '../../components/PartidoCard';
import Colors from '../../constants/Colors';

const MODALIDADES = [
  'Todas',
  'Futbol Sala',
  'Futbol 7',
  'Futbol 11',
  'Baloncesto',
  'Padel',
  'Tenis',
  'Voleibol',
  'Otro',
];

export default function PartidosScreen() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [municipioFilter, setMunicipioFilter] = useState('');
  const [modalidadFilter, setModalidadFilter] = useState('Todas');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [newMunicipio, setNewMunicipio] = useState('');
  const [newPista, setNewPista] = useState('');
  const [newModalidad, setNewModalidad] = useState('Futbol Sala');
  const [newFecha, setNewFecha] = useState('');
  const [newHora, setNewHora] = useState('');
  const [newHuecos, setNewHuecos] = useState('');
  const [creating, setCreating] = useState(false);

  const loadPartidos = useCallback(async () => {
    try {
      const filters: { municipio?: string; modalidad?: string } = {};
      if (municipioFilter.trim()) filters.municipio = municipioFilter.trim();
      if (modalidadFilter !== 'Todas') filters.modalidad = modalidadFilter;
      const response = await api.getPartidos(filters);
      setPartidos(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron cargar los partidos.');
    }
  }, [municipioFilter, modalidadFilter]);

  useEffect(() => {
    setLoading(true);
    loadPartidos().finally(() => setLoading(false));
  }, [loadPartidos]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadPartidos();
    setRefreshing(false);
  }

  async function handleCreate() {
    if (!newMunicipio.trim() || !newPista.trim() || !newFecha.trim() || !newHora.trim() || !newHuecos.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    setCreating(true);
    try {
      await api.createPartido({
        municipio: newMunicipio.trim(),
        pista: newPista.trim(),
        modalidad: newModalidad,
        fecha: newFecha.trim(),
        hora: newHora.trim(),
        huecos: parseInt(newHuecos, 10),
      });
      Alert.alert('Partido creado', 'El partido se ha creado correctamente.');
      setShowCreateModal(false);
      resetCreateForm();
      await loadPartidos();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear el partido.');
    } finally {
      setCreating(false);
    }
  }

  function resetCreateForm() {
    setNewMunicipio('');
    setNewPista('');
    setNewModalidad('Futbol Sala');
    setNewFecha('');
    setNewHora('');
    setNewHuecos('');
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="football-outline" size={64} color={Colors.border} />
        <Text style={styles.emptyTitle}>No hay partidos</Text>
        <Text style={styles.emptySubtitle}>
          No se encontraron partidos con los filtros seleccionados.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filters */}
      <View style={styles.filterContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por municipio..."
              placeholderTextColor={Colors.textSecondary}
              value={municipioFilter}
              onChangeText={setMunicipioFilter}
              returnKeyType="search"
            />
            {municipioFilter.length > 0 && (
              <TouchableOpacity onPress={() => setMunicipioFilter('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.modalidadScroll}
          contentContainerStyle={styles.modalidadScrollContent}
        >
          {MODALIDADES.map((mod) => (
            <TouchableOpacity
              key={mod}
              style={[
                styles.modalidadChip,
                modalidadFilter === mod && styles.modalidadChipActive,
              ]}
              onPress={() => setModalidadFilter(mod)}
            >
              <Text
                style={[
                  styles.modalidadChipText,
                  modalidadFilter === mod && styles.modalidadChipTextActive,
                ]}
              >
                {mod}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Partido List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={partidos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PartidoCard partido={item} />}
          contentContainerStyle={partidos.length === 0 ? styles.emptyList : styles.listContent}
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
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo partido</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Municipio</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: Cádiz"
                placeholderTextColor={Colors.textSecondary}
                value={newMunicipio}
                onChangeText={setNewMunicipio}
              />

              <Text style={styles.fieldLabel}>Pista</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: Pista Loreto"
                placeholderTextColor={Colors.textSecondary}
                value={newPista}
                onChangeText={setNewPista}
              />

              <Text style={styles.fieldLabel}>Modalidad</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.modalModalidadScroll}
              >
                {MODALIDADES.filter((m) => m !== 'Todas').map((mod) => (
                  <TouchableOpacity
                    key={mod}
                    style={[
                      styles.modalidadChip,
                      newModalidad === mod && styles.modalidadChipActive,
                    ]}
                    onPress={() => setNewModalidad(mod)}
                  >
                    <Text
                      style={[
                        styles.modalidadChipText,
                        newModalidad === mod && styles.modalidadChipTextActive,
                      ]}
                    >
                      {mod}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Fecha (AAAA-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: 2026-06-15"
                placeholderTextColor={Colors.textSecondary}
                value={newFecha}
                onChangeText={setNewFecha}
              />

              <Text style={styles.fieldLabel}>Hora (HH:MM)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: 20:00"
                placeholderTextColor={Colors.textSecondary}
                value={newHora}
                onChangeText={setNewHora}
              />

              <Text style={styles.fieldLabel}>Huecos (plazas)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: 10"
                placeholderTextColor={Colors.textSecondary}
                value={newHuecos}
                onChangeText={setNewHuecos}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.createButton, creating && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={creating}
                activeOpacity={0.8}
              >
                {creating ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.createButtonText}>Crear partido</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterContainer: {
    backgroundColor: Colors.card,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: Colors.text,
  },
  modalidadScroll: {
    maxHeight: 40,
  },
  modalidadScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  modalidadChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 4,
  },
  modalidadChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalidadChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  modalidadChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
    marginTop: 12,
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
  modalModalidadScroll: {
    maxHeight: 40,
    marginTop: 4,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
