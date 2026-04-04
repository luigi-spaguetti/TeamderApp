import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import Colors from '../constants/Colors';

interface Props {
  visible: boolean;
  region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  markerCoord: { latitude: number; longitude: number } | null;
  onRegionChange: (region: any) => void;
  onPress: (e: any) => void;
  onMarkerDragEnd: (e: any) => void;
  onClose: () => void;
}

export default function MapPickerModal({ visible, region, markerCoord, onRegionChange, onPress, onMarkerDragEnd, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={26} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Seleccionar ubicación</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.confirmText}>OK</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Toca el mapa para marcar la ubicación de la pista</Text>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={onRegionChange}
          onPress={onPress}
        >
          {markerCoord && (
            <Marker
              coordinate={markerCoord}
              draggable
              onDragEnd={onMarkerDragEnd}
            />
          )}
        </MapView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  confirmText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  hint: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 8, backgroundColor: Colors.card },
  map: { flex: 1 },
});
