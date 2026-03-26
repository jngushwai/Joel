export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Route {
  id: string;
  name: string;
  path: string[];
  color: string;
}

export interface Bus {
  id: string;
  routeId: string;
  direction: number;
  currentStationIndex: number;
  progress: number;
  crowdLevel: 'Low' | 'Medium' | 'High';
  speed: number;
  lat: number;
  lng: number;
  nextStationId: string | null;
  distanceToNext: number;
  etaToNext: number;
}
