import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HistorialItem } from '../../types';
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
      day: '2-digit',
      month: 'short',
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

export default function HistorialScreen() {
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistorial = useCallback(async () => {
    try {
      const response = await api.getHistorial();
      setHistorial(response.data);
    } catch (error: any) {
      Alert.alert(i18n.t('common.error'), error.message || i18n.t('historial.loadError'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadHistorial().finally(() => setLoading(false));
    }, [loadHistorial])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadHistorial();
    setRefreshing(false);
  }

  function renderItem({ item }: { item: HistorialItem }) {
    return (
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getModalidadIcon(item.modalidad)}
            size={24}
            color={Colors.primary}
          />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.modalidad}>{item.modalidad}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {item.pista} - {item.municipio}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {formatFecha(item.fecha)} a las {formatHora(item.hora)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={64} color={Colors.border} />
        <Text style={styles.emptyTitle}>{i18n.t('historial.empty')}</Text>
        <Text style={styles.emptySubtitle}>
          {i18n.t('historial.emptyDesc')}
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
          data={historial}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={
            historial.length === 0 ? styles.emptyList : styles.listContent
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
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  modalidad: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
});
