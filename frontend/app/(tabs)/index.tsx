import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapPickerModal from '../../components/MapPickerModal';
import { Partido, Grupo } from '../../types';
import * as api from '../../services/api';
import PartidoCard from '../../components/PartidoCard';
import Colors from '../../constants/Colors';
import { PROVINCIAS, getMunicipios } from '../../constants/Provincias';
import i18n from '../../i18n';

const MODALIDADES_KEYS = [
  'todas', 'futbolSala', 'futbol7', 'futbol11',
  'baloncesto', 'padel', 'tenis', 'voleibol', 'otro',
];
const MODALIDADES_VALUES = [
  'Todas', 'Futbol Sala', 'Futbol 7', 'Futbol 11',
  'Baloncesto', 'Padel', 'Tenis', 'Voleibol', 'Otro',
];

function getModalidadLabel(value: string): string {
  const idx = MODALIDADES_VALUES.indexOf(value);
  if (idx >= 0) return i18n.t(`partidos.${MODALIDADES_KEYS[idx]}`);
  return value;
}

function CalendarPicker({
  value,
  onSelect,
  onClose,
  visible,
}: {
  value: string;
  onSelect: (date: string) => void;
  onClose: () => void;
  visible: boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const monthNames = Array.from({ length: 12 }, (_, i) => i18n.t(`partidos.months.${i}`));

  function formatDate(day: number) {
    const m = (viewMonth + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${viewYear}-${m}-${d}`;
  }

  function isPast(day: number) {
    const date = new Date(viewYear, viewMonth, day);
    return date < today;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.calendarContainer} onStartShouldSetResponder={() => true}>
          <View style={styles.calendarNav}>
            <TouchableOpacity onPress={prevMonth} disabled={!canGoPrev} style={{ opacity: canGoPrev ? 1 : 0.3 }}>
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.calendarMonthTitle}>{monthNames[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth}>
              <Ionicons name="chevron-forward" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.calendarDaysHeader}>
            {Array.from({ length: 7 }, (_, i) => i18n.t(`partidos.weekDays.${i}`)).map((d: string, i: number) => (
              <Text key={i} style={styles.calendarDayLabel}>{d}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {cells.map((day, i) => {
              if (day === null) return <View key={`e${i}`} style={styles.calendarCell} />;
              const dateStr = formatDate(day);
              const past = isPast(day);
              const selected = dateStr === value;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.calendarCell, selected && styles.calendarCellSelected]}
                  onPress={() => { if (!past) { onSelect(dateStr); onClose(); } }}
                  disabled={past}
                >
                  <Text style={[
                    styles.calendarDayText,
                    past && styles.calendarDayPast,
                    selected && styles.calendarDaySelected,
                  ]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function TimePicker({
  value,
  onSelect,
  onClose,
  visible,
}: {
  value: string;
  onSelect: (time: string) => void;
  onClose: () => void;
  visible: boolean;
}) {
  const [hour, setHour] = useState(() => {
    if (value) return parseInt(value.split(':')[0], 10);
    return 20;
  });
  const [minute, setMinute] = useState(() => {
    if (value) return parseInt(value.split(':')[1], 10);
    return 0;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  function confirm() {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    onSelect(`${h}:${m}`);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.timePickerContainer} onStartShouldSetResponder={() => true}>
          <Text style={styles.timePickerTitle}>{i18n.t('partidos.selectTime')}</Text>
          <View style={styles.timePickerDisplay}>
            <Text style={styles.timePickerBigText}>
              {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
            </Text>
          </View>
          <View style={styles.timePickerColumns}>
            <View style={styles.timePickerColumn}>
              <Text style={styles.timePickerColumnLabel}>{i18n.t('partidos.hora')}</Text>
              <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                {hours.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.timePickerItem, h === hour && styles.timePickerItemActive]}
                    onPress={() => setHour(h)}
                  >
                    <Text style={[styles.timePickerItemText, h === hour && styles.timePickerItemTextActive]}>
                      {h.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.timePickerSeparator} />
            <View style={styles.timePickerColumn}>
              <Text style={styles.timePickerColumnLabel}>{i18n.t('partidos.minute')}</Text>
              <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                {minutes.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.timePickerItem, m === minute && styles.timePickerItemActive]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[styles.timePickerItemText, m === minute && styles.timePickerItemTextActive]}>
                      {m.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <TouchableOpacity style={styles.timePickerConfirm} onPress={confirm}>
            <Text style={styles.timePickerConfirmText}>{i18n.t('common.confirm')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function DropdownPicker({
  label,
  value,
  options,
  onSelect,
  placeholder,
  disabled,
}: {
  label?: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TouchableOpacity
        style={[styles.dropdown, disabled && styles.dropdownDisabled]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {options.length > 8 && (
              <View style={styles.pickerSearchContainer}>
                <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
                <TextInput
                  style={styles.pickerSearchInput}
                  placeholder={i18n.t('common.search')}
                  placeholderTextColor={Colors.textSecondary}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            )}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, item === value && styles.pickerItemActive]}
                  onPress={() => {
                    onSelect(item);
                    setSearch('');
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, item === value && styles.pickerItemTextActive]}>
                    {item}
                  </Text>
                  {item === value && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
              style={styles.pickerList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export default function PartidosScreen() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [provinciaFilter, setProvinciaFilter] = useState('');
  const [municipioFilter, setMunicipioFilter] = useState('');
  const [modalidadFilter, setModalidadFilter] = useState('Todas');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [newProvincia, setNewProvincia] = useState('');
  const [newMunicipio, setNewMunicipio] = useState('');
  const [newPista, setNewPista] = useState('');
  const [newModalidad, setNewModalidad] = useState('Futbol Sala');
  const [newModalidadCustom, setNewModalidadCustom] = useState('');
  const [newFecha, setNewFecha] = useState('');
  const [newHora, setNewHora] = useState('');
  const [newHuecos, setNewHuecos] = useState('');
  const [creating, setCreating] = useState(false);
  const [misGrupos, setMisGrupos] = useState<Grupo[]>([]);
  const [selectedGrupoIds, setSelectedGrupoIds] = useState<number[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [newLatitud, setNewLatitud] = useState<number | null>(null);
  const [newLongitud, setNewLongitud] = useState<number | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.4168,
    longitude: -3.7038,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const municipiosDisponibles = provinciaFilter ? getMunicipios(provinciaFilter) : [];
  const newMunicipiosDisponibles = newProvincia ? getMunicipios(newProvincia) : [];

  const loadPartidos = useCallback(async () => {
    try {
      const filters: { provincia?: string; municipio?: string; modalidad?: string } = {};
      if (provinciaFilter) filters.provincia = provinciaFilter;
      if (municipioFilter) filters.municipio = municipioFilter;
      if (modalidadFilter !== 'Todas') filters.modalidad = modalidadFilter;
      const response = await api.getPartidos(filters);
      setPartidos(response.data);
    } catch (error: any) {
      Alert.alert(i18n.t('common.error'), error.message || i18n.t('partidos.loadError'));
    }
  }, [provinciaFilter, municipioFilter, modalidadFilter]);

  useEffect(() => {
    setLoading(true);
    loadPartidos().finally(() => setLoading(false));
  }, [loadPartidos]);

  // Reset municipio when provincia changes
  useEffect(() => {
    setMunicipioFilter('');
  }, [provinciaFilter]);

  useEffect(() => {
    setNewMunicipio('');
  }, [newProvincia]);

  async function loadMisGrupos() {
    setLoadingGrupos(true);
    try {
      const response = await api.getGrupos();
      setMisGrupos(response.data);
    } catch {
      setMisGrupos([]);
    } finally {
      setLoadingGrupos(false);
    }
  }

  function toggleGrupo(id: number) {
    setSelectedGrupoIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  function openCreateModal() {
    setShowCreateModal(true);
    loadMisGrupos();
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadPartidos();
    setRefreshing(false);
  }

  async function handleCreate() {
    if (!newProvincia.trim() || !newMunicipio.trim() || !newPista.trim() || !newFecha.trim() || !newHora.trim() || !newHuecos.trim()) {
      Alert.alert(i18n.t('common.error'), i18n.t('partidos.allFieldsRequired'));
      return;
    }
    if (newModalidad === 'Otro' && !newModalidadCustom.trim()) {
      Alert.alert(i18n.t('common.error'), i18n.t('partidos.writeSportName'));
      return;
    }

    setCreating(true);
    try {
      const modalidadFinal = newModalidad === 'Otro' ? newModalidadCustom.trim() : newModalidad;
      await api.createPartido({
        provincia: newProvincia.trim(),
        municipio: newMunicipio.trim(),
        pista: newPista.trim(),
        modalidad: modalidadFinal,
        fecha: newFecha.trim(),
        hora: newHora.trim(),
        huecos: parseInt(newHuecos, 10),
        latitud: newLatitud ?? undefined,
        longitud: newLongitud ?? undefined,
        grupo_ids: selectedGrupoIds.length > 0 ? selectedGrupoIds : undefined,
      });
      Alert.alert(i18n.t('partidos.partidoCreated'), i18n.t('partidos.partidoCreatedMsg'));
      setShowCreateModal(false);
      resetCreateForm();
      await loadPartidos();
    } catch (error: any) {
      Alert.alert(i18n.t('common.error'), error.message || i18n.t('partidos.createError'));
    } finally {
      setCreating(false);
    }
  }

  function resetCreateForm() {
    setNewProvincia('');
    setNewMunicipio('');
    setNewPista('');
    setNewModalidad('Futbol Sala');
    setNewModalidadCustom('');
    setNewFecha('');
    setNewHora('');
    setNewHuecos('');
    setNewLatitud(null);
    setNewLongitud(null);
    setSelectedGrupoIds([]);
  }

  async function openMapPicker() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setMapRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
    setShowMapPicker(true);
  }

  function handleMapPress(e: any) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setNewLatitud(latitude);
    setNewLongitud(longitude);
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="football-outline" size={64} color={Colors.border} />
        <Text style={styles.emptyTitle}>{i18n.t('partidos.noPartidos')}</Text>
        <Text style={styles.emptySubtitle}>
          {i18n.t('partidos.noPartidosFilters')}
        </Text>
      </View>
    );
  }

  function clearFilters() {
    setProvinciaFilter('');
    setMunicipioFilter('');
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filters */}
      <View style={styles.filterContainer}>
        <View style={styles.dropdownRow}>
          <View style={styles.dropdownHalf}>
            <DropdownPicker
              value={provinciaFilter}
              options={PROVINCIAS}
              onSelect={setProvinciaFilter}
              placeholder={i18n.t('partidos.provincia')}
            />
          </View>
          <View style={styles.dropdownHalf}>
            <DropdownPicker
              value={municipioFilter}
              options={municipiosDisponibles}
              onSelect={setMunicipioFilter}
              placeholder={i18n.t('partidos.municipio')}
              disabled={!provinciaFilter}
            />
          </View>
          {(provinciaFilter || municipioFilter) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Ionicons name="close-circle" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.modalidadScroll}
          contentContainerStyle={styles.modalidadScrollContent}
        >
          {MODALIDADES_VALUES.map((mod) => (
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
                {getModalidadLabel(mod)}
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
        onPress={openCreateModal}
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
              <Text style={styles.modalTitle}>{i18n.t('partidos.newPartido')}</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.visibilitySection}>
                <View style={styles.visibilitySectionHeader}>
                  <Ionicons name="eye-outline" size={20} color={Colors.primary} />
                  <Text style={styles.visibilitySectionTitle}>{i18n.t('partidos.visibility')}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    selectedGrupoIds.length === 0 && styles.visibilityOptionActive,
                  ]}
                  onPress={() => setSelectedGrupoIds([])}
                  activeOpacity={0.7}
                >
                  <View style={[styles.visibilityIconBox, selectedGrupoIds.length === 0 && styles.visibilityIconBoxActive]}>
                    <Ionicons name="globe-outline" size={20} color={selectedGrupoIds.length === 0 ? Colors.white : Colors.primary} />
                  </View>
                  <View style={styles.visibilityOptionContent}>
                    <Text style={[styles.visibilityOptionTitle, selectedGrupoIds.length === 0 && styles.visibilityOptionTitleActive]}>
                      {i18n.t('partidos.public')}
                    </Text>
                    <Text style={styles.visibilityOptionDesc}>
                      {i18n.t('partidos.publicDesc')}
                    </Text>
                  </View>
                  {selectedGrupoIds.length === 0 && (
                    <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                  )}
                </TouchableOpacity>

                <View style={styles.visibilityDivider}>
                  <View style={styles.visibilityDividerLine} />
                  <Text style={styles.visibilityDividerText}>{i18n.t('partidos.shareWithGroups')}</Text>
                  <View style={styles.visibilityDividerLine} />
                </View>

                {loadingGrupos ? (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 12 }} />
                ) : misGrupos.length === 0 ? (
                  <Text style={styles.noGruposText}>{i18n.t('partidos.noGroups')}</Text>
                ) : (
                  misGrupos.map((grupo) => {
                    const isSelected = selectedGrupoIds.includes(grupo.id);
                    return (
                      <TouchableOpacity
                        key={grupo.id}
                        style={[styles.grupoSelectRow, isSelected && styles.grupoSelectRowActive]}
                        onPress={() => toggleGrupo(grupo.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.grupoSelectIcon, isSelected && styles.grupoSelectIconActive]}>
                          <Ionicons name="people" size={16} color={isSelected ? Colors.white : Colors.primary} />
                        </View>
                        <View style={styles.grupoSelectInfo}>
                          <Text style={[styles.grupoSelectName, isSelected && styles.grupoSelectNameActive]}>
                            {grupo.nombre}
                          </Text>
                          <Text style={styles.grupoSelectMembers}>
                            {grupo.integrantes} {grupo.integrantes === 1 ? i18n.t('common.member') : i18n.t('common.members')}
                          </Text>
                        </View>
                        <View style={[styles.grupoCheckbox, isSelected && styles.grupoCheckboxActive]}>
                          {isSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}

                {selectedGrupoIds.length > 0 && (
                  <View style={styles.selectedGruposInfo}>
                    <Ionicons name="lock-closed-outline" size={14} color={Colors.secondary} />
                    <Text style={styles.selectedGruposText}>
                      {selectedGrupoIds.length === 1
                        ? i18n.t('partidos.onlyVisibleGroups', { count: selectedGrupoIds.length })
                        : i18n.t('partidos.onlyVisibleGroupsPlural', { count: selectedGrupoIds.length })}
                    </Text>
                  </View>
                )}
              </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <DropdownPicker
                label={i18n.t('partidos.provincia')}
                value={newProvincia}
                options={PROVINCIAS}
                onSelect={setNewProvincia}
                placeholder={i18n.t('partidos.selectProvincia')}
              />

              <DropdownPicker
                label={i18n.t('partidos.municipio')}
                value={newMunicipio}
                options={newMunicipiosDisponibles}
                onSelect={setNewMunicipio}
                placeholder={i18n.t('partidos.selectMunicipio')}
                disabled={!newProvincia}
              />

              <Text style={styles.fieldLabel}>{i18n.t('partidos.pista')}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={i18n.t('partidos.pistaPlaceholder')}
                placeholderTextColor={Colors.textSecondary}
                value={newPista}
                onChangeText={setNewPista}
              />

              <Text style={styles.fieldLabel}>{i18n.t('partidos.modalidad')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.modalModalidadScroll}
              >
                {MODALIDADES_VALUES.filter((m) => m !== 'Todas').map((mod) => (
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
                      {getModalidadLabel(mod)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {newModalidad === 'Otro' && (
                <>
                  <Text style={styles.fieldLabel}>{i18n.t('partidos.sportName')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={i18n.t('partidos.sportPlaceholder')}
                    placeholderTextColor={Colors.textSecondary}
                    value={newModalidadCustom}
                    onChangeText={setNewModalidadCustom}
                  />
                </>
              )}

              <Text style={styles.fieldLabel}>{i18n.t('partidos.fecha')}</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowCalendar(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <Text style={[styles.dateTimeText, !newFecha && styles.dropdownPlaceholder]}>
                  {newFecha || i18n.t('partidos.selectDate')}
                </Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>{i18n.t('partidos.hora')}</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={20} color={Colors.primary} />
                <Text style={[styles.dateTimeText, !newHora && styles.dropdownPlaceholder]}>
                  {newHora || i18n.t('partidos.selectTime')}
                </Text>
              </TouchableOpacity>

              <CalendarPicker
                visible={showCalendar}
                value={newFecha}
                onSelect={setNewFecha}
                onClose={() => setShowCalendar(false)}
              />
              <TimePicker
                visible={showTimePicker}
                value={newHora}
                onSelect={setNewHora}
                onClose={() => setShowTimePicker(false)}
              />

              <Text style={styles.fieldLabel}>{i18n.t('partidos.huecos')}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={i18n.t('partidos.huecosPlaceholder')}
                placeholderTextColor={Colors.textSecondary}
                value={newHuecos}
                onChangeText={setNewHuecos}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>{i18n.t('partidos.locationOptional')}</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={openMapPicker}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={20} color={Colors.primary} />
                <Text style={[styles.dateTimeText, !newLatitud && styles.dropdownPlaceholder]}>
                  {newLatitud ? i18n.t('partidos.locationSelected') : i18n.t('partidos.selectOnMap')}
                </Text>
                {newLatitud && (
                  <TouchableOpacity onPress={() => { setNewLatitud(null); setNewLongitud(null); }}>
                    <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

 
              <TouchableOpacity
                style={[styles.createButton, creating && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={creating}
                activeOpacity={0.8}
              >
                {creating ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.createButtonText}>{i18n.t('partidos.createPartido')}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Map Picker Modal */}
      <MapPickerModal
        visible={showMapPicker}
        region={mapRegion}
        markerCoord={newLatitud != null && newLongitud != null ? { latitude: newLatitud, longitude: newLongitud } : null}
        onRegionChange={setMapRegion}
        onPress={handleMapPress}
        onMarkerDragEnd={(e: any) => {
          setNewLatitud(e.nativeEvent.coordinate.latitude);
          setNewLongitud(e.nativeEvent.coordinate.longitude);
        }}
        onClose={() => setShowMapPicker(false)}
      />
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
  dropdownRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 10,
    alignItems: 'center',
    gap: 8,
  },
  dropdownHalf: {
    flex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownDisabled: {
    opacity: 0.5,
  },
  dropdownText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: Colors.textSecondary,
  },
  clearButton: {
    padding: 4,
  },
  // Picker modal styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  pickerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
  pickerList: {
    maxHeight: 350,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  pickerItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  pickerItemText: {
    fontSize: 15,
    color: Colors.text,
  },
  pickerItemTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  // Modalidad chips
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
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  dateTimeText: {
    fontSize: 15,
    color: Colors.text,
  },
  // Calendar styles
  calendarContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonthTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCellSelected: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 15,
    color: Colors.text,
  },
  calendarDayPast: {
    color: Colors.border,
  },
  calendarDaySelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  // Time picker styles
  timePickerContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    width: '85%',
  },
  timePickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  timePickerDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timePickerBigText: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.primary,
  },
  timePickerColumns: {
    flexDirection: 'row',
    height: 200,
  },
  timePickerColumn: {
    flex: 1,
  },
  timePickerColumnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  timePickerScroll: {
    flex: 1,
  },
  timePickerSeparator: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  timePickerItem: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 1,
    marginHorizontal: 4,
  },
  timePickerItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  timePickerItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  timePickerItemTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  timePickerConfirm: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  timePickerConfirmText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  // Visibility / Group selector styles
  visibilitySection: {
    marginTop: 20,
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  visibilitySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  visibilitySectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  visibilityOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  visibilityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  visibilityIconBoxActive: {
    backgroundColor: Colors.primary,
  },
  visibilityOptionContent: {
    flex: 1,
  },
  visibilityOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  visibilityOptionTitleActive: {
    color: Colors.primary,
  },
  visibilityOptionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  visibilityDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  visibilityDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  visibilityDividerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  noGruposText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  grupoSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  grupoSelectRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  grupoSelectIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  grupoSelectIconActive: {
    backgroundColor: Colors.primary,
  },
  grupoSelectInfo: {
    flex: 1,
  },
  grupoSelectName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  grupoSelectNameActive: {
    color: Colors.primary,
  },
  grupoSelectMembers: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  grupoCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grupoCheckboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectedGruposInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: Colors.secondaryLight,
    borderRadius: 8,
  },
  selectedGruposText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
  },
});
