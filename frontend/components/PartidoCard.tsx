import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Partido } from '../types';
import Colors from '../constants/Colors';

interface PartidoCardProps {
  partido: Partido;
}

function getModalidadIcon(modalidad: string): keyof typeof Ionicons.glyphMap {
  const lower = modalidad.toLowerCase();
  if (lower.includes('futbol') || lower.includes('fútbol')) return 'football-outline';
  if (lower.includes('baloncesto') || lower.includes('basket')) return 'basketball-outline';
  if (lower.includes('tenis')) return 'tennisball-outline';
  if (lower.includes('voleibol') || lower.includes('voley')) return 'volleyball-outline' as keyof typeof Ionicons.glyphMap;
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

export default function PartidoCard({ partido }: PartidoCardProps) {
  const router = useRouter();
  const progress = partido.huecos > 0
    ? partido.huecos_inscritos / partido.huecos
    : 0;
  const isFull = partido.huecos_inscritos >= partido.huecos;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/partido/${partido.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getModalidadIcon(partido.modalidad)}
            size={28}
            color={Colors.primary}
          />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.modalidad}>{partido.modalidad}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.locationText}>
              {partido.pista} - {partido.municipio}
            </Text>
          </View>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatFecha(partido.fecha)}</Text>
          <Text style={styles.timeText}>{formatHora(partido.hora)}</Text>
        </View>
      </View>

      <View style={styles.capacityContainer}>
        <View style={styles.capacityHeader}>
          <Text style={styles.capacityLabel}>Plazas</Text>
          <Text style={[styles.capacityText, isFull && styles.capacityFull]}>
            {partido.huecos_inscritos}/{partido.huecos}
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
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  modalidad: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
    flexShrink: 1,
  },
  dateContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
  },
  capacityContainer: {
    marginTop: 12,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  capacityLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  capacityText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  capacityFull: {
    color: Colors.secondary,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
