import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DetailMap from '../../components/DetailMap';
import { PartidoDetalle } from '../../types';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import Colors from '../../constants/Colors';
import i18n from '../../i18n';

function getModalidadIcon(modalidad: string): keyof typeof Ionicons.glyphMap {
  const lower = modalidad.toLowerCase();
  if (lower.includes('futbol') || lower.includes('fútbol')) return 'football-outline';
  if (lower.includes('baloncesto') || lower.includes('basket')) return 'basketball-outline';
  if (lower.includes('tenis')) return 'tennisball-outline';
  if (lower.includes('padel') || lower.includes('pádel')) return 'tennisball-outline';
  return 'trophy-outline';
}

function formatFecha(fecha: string): string {
  try {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return fecha;
  }
}

function formatHora(hora: string): string {
  if (!hora) return '';
  return hora.substring(0, 5);
}

export default function PartidoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [partido, setPartido] = useState<PartidoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadPartido() {
    try {
      const response = await api.getPartido(Number(id));
      setPartido(response.data);
    } catch (error: any) {
      Alert.alert(i18n.t('common.error'), error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadPartido();
  }, [id]);

  const isInscrito = partido?.inscritos?.some((p) => p.id === user?.id) ?? false;
  const isFull = partido ? partido.huecos_inscritos >= partido.huecos : false;
  const progress = partido && partido.huecos > 0
    ? partido.huecos_inscritos / partido.huecos
    : 0;

  async function handleInscribirse() {
    setActionLoading(true);
    try {
      await api.inscribirse(Number(id));
      Alert.alert(i18n.t('partido.joined'), i18n.t('partido.joinedMsg'));
      await loadPartido();
    } catch (error: any) {
      Alert.alert(i18n.t('common.error'), error.message || i18n.t('partido.joinError'));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDesinscribirse() {
    Alert.alert(
      i18n.t('common.confirm'),
      i18n.t('partido.leaveConfirm'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('partido.leave'),
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.desinscribirse(Number(id));
              Alert.alert(i18n.t('partido.left'), i18n.t('partido.leftMsg'));
              await loadPartido();
            } catch (error: any) {
              Alert.alert(i18n.t('common.error'), error.message || i18n.t('partido.leaveError'));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: i18n.t('partido.title'), headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </>
    );
  }

  if (!partido) return null;

  return (
    <>
      <Stack.Screen
        options={{
          title: partido.modalidad,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero section */}
          <View style={styles.heroSection}>
            <View style={styles.heroIconContainer}>
              <Ionicons
                name={getModalidadIcon(partido.modalidad)}
                size={48}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.heroModalidad}>{partido.modalidad}</Text>
            {partido.id_grupo && (
              <TouchableOpacity
                style={styles.grupoBadge}
                onPress={() => router.push(`/grupo/${partido.id_grupo}`)}
              >
                <Ionicons name="people" size={14} color={Colors.primary} />
                <Text style={styles.grupoBadgeText}>{i18n.t('partido.groupMatch')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Info cards */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Ionicons name="location-outline" size={22} color={Colors.primary} />
              <Text style={styles.infoLabel}>{i18n.t('partido.location')}</Text>
              <Text style={styles.infoValue}>{partido.pista}</Text>
              <Text style={styles.infoSubvalue}>{partido.municipio}</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="calendar-outline" size={22} color={Colors.primary} />
              <Text style={styles.infoLabel}>{i18n.t('partido.dateTime')}</Text>
              <Text style={styles.infoValue}>{formatFecha(partido.fecha)}</Text>
              <Text style={styles.infoSubvalue}>{formatHora(partido.hora)}</Text>
            </View>
          </View>

          {/* Map */}
          {partido.latitud != null && partido.longitud != null && (
            <DetailMap
              latitud={partido.latitud}
              longitud={partido.longitud}
              pista={partido.pista}
            />
          )}

          {/* Capacity */}
          <View style={styles.capacitySection}>
            <View style={styles.capacityHeader}>
              <Text style={styles.sectionTitle}>{i18n.t('partido.capacity')}</Text>
              <Text style={[styles.capacityCount, isFull && styles.capacityFull]}>
                {partido.huecos_inscritos} / {partido.huecos}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(progress * 100, 100)}%`,
                    backgroundColor: isFull ? Colors.secondary : Colors.primary,
                  },
                ]}
              />
            </View>
            {isFull && (
              <Text style={styles.fullText}>{i18n.t('partido.full')}</Text>
            )}
          </View>

          {/* Inscribed Players */}
          <View style={styles.playersSection}>
            <Text style={styles.sectionTitle}>{i18n.t('partido.players')}</Text>
            {partido.inscritos && partido.inscritos.length > 0 ? (
              partido.inscritos.map((jugador) => (
                <View key={jugador.id} style={styles.playerRow}>
                  <View style={styles.playerAvatar}>
                    <Ionicons name="person" size={16} color={Colors.white} />
                  </View>
                  <Text style={styles.playerName}>{jugador.nombre}</Text>
                  {jugador.id === user?.id && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>{i18n.t('common.you')}</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noPlayersText}>
                {i18n.t('partido.noPlayers')}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={[styles.actionContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {isInscrito ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger, actionLoading && styles.buttonDisabled]}
              onPress={handleDesinscribirse}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={20} color={Colors.white} />
                  <Text style={styles.actionButtonText}>{i18n.t('partido.leave')}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionButtonPrimary,
                (isFull || actionLoading) && styles.buttonDisabled,
              ]}
              onPress={handleInscribirse}
              disabled={isFull || actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                  <Text style={styles.actionButtonText}>
                    {isFull ? i18n.t('partido.full') : i18n.t('partido.join')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
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
    paddingBottom: 100,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroModalidad: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  grupoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
  },
  grupoBadgeText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  infoGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  infoSubvalue: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  capacitySection: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  capacityCount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  capacityFull: {
    color: Colors.secondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  fullText: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  playersSection: {
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
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerName: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  youBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  youBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  noPlayersText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  actionButtonDanger: {
    backgroundColor: Colors.danger,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
