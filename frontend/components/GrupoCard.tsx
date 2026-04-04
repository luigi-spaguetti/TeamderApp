import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Grupo } from '../types';
import Colors from '../constants/Colors';

interface GrupoCardProps {
  grupo: Grupo;
}

export default function GrupoCard({ grupo }: GrupoCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/grupo/${grupo.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="people" size={28} color={Colors.primary} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.nombre} numberOfLines={1}>
          {grupo.nombre}
        </Text>
        <View style={styles.memberRow}>
          <Ionicons
            name="person-outline"
            size={14}
            color={Colors.textSecondary}
          />
          <Text style={styles.memberText}>
            {grupo.integrantes ?? 0} {(grupo.integrantes ?? 0) === 1 ? 'miembro' : 'miembros'}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
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
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
});
