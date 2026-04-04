import React from 'react';

interface Props {
  latitud: number;
  longitud: number;
  pista: string;
}

declare const DetailMap: React.FC<Props>;
export default DetailMap;
