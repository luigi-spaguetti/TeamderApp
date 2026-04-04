import React from 'react';

interface Props {
  visible: boolean;
  region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  markerCoord: { latitude: number; longitude: number } | null;
  onRegionChange: (region: any) => void;
  onPress: (e: any) => void;
  onMarkerDragEnd: (e: any) => void;
  onClose: () => void;
}

declare const MapPickerModal: React.FC<Props>;
export default MapPickerModal;
