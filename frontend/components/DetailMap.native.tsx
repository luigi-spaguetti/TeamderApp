import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Colors from '../constants/Colors';

interface Props {
  latitud: number;
  longitud: number;
  pista: string;
}

export default function DetailMap({ latitud, longitud, pista }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Ubicación</Text>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: latitud,
            longitude: longitud,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker coordinate={{ latitude: latitud, longitude: longitud }} title={pista} />
        </MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text },
  mapContainer: { borderRadius: 10, overflow: 'hidden', marginTop: 10 },
  map: { height: 180, borderRadius: 10 },
});
