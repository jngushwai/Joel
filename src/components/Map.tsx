import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Bus, Route, Station } from '../types';
import { Users, Clock, Navigation } from 'lucide-react';
import { renderToString } from 'react-dom/server';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const stationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedStationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const createStationIcon = (crowdLevel: string, isSelected: boolean) => {
  const crowdColor = crowdLevel === 'High' ? '#ef4444' : crowdLevel === 'Medium' ? '#f59e0b' : '#10b981';
  const strokeColor = isSelected ? '#2563eb' : '#ffffff';
  const strokeWidth = isSelected ? '3' : '2';
  const size = isSelected ? 32 : 24;
  const anchor = isSelected ? 16 : 12;

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="${crowdColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `;
  
  return new L.DivIcon({
    html: svgIcon,
    className: 'station-marker',
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
  });
};

// Custom Bus Icon Generator
const createBusIcon = (routeColor: string, crowdLevel: string) => {
  const crowdColor = crowdLevel === 'High' ? '#ef4444' : crowdLevel === 'Medium' ? '#f59e0b' : '#10b981';
  
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="${routeColor}" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="${crowdColor}"/>
    </svg>
  `;
  
  return new L.DivIcon({
    html: svgIcon,
    className: 'bus-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface MapProps {
  stations: Station[];
  routes: Route[];
  buses: Bus[];
  onRouteClick?: (routeId: string) => void;
  onStationClick?: (stationId: string) => void;
  selectedStationId?: string | null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function LiveMap({ stations, routes, buses, onRouteClick, onStationClick, selectedStationId }: MapProps) {
  const center: [number, number] = [-6.8000, 39.2400]; // Center of Dar es Salaam BRT

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer center={center} zoom={13} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Draw Routes */}
        {routes.map(route => {
          const positions = route.path.map(stationId => {
            const station = stations.find(s => s.id === stationId);
            return [station?.lat, station?.lng] as [number, number];
          }).filter(pos => pos[0] !== undefined);
          
          return (
            <Polyline 
              key={route.id} 
              positions={positions} 
              color={route.color} 
              weight={6} 
              opacity={0.8} 
              eventHandlers={{
                click: () => onRouteClick?.(route.id)
              }}
              pathOptions={{ className: 'cursor-pointer hover:opacity-100 transition-opacity' }}
            />
          );
        })}

        {/* Draw Stations */}
        {stations.map(station => (
          <Marker 
            key={station.id} 
            position={[station.lat, station.lng]}
            icon={createStationIcon(station.crowdLevel, station.id === selectedStationId)}
            eventHandlers={{
              click: () => onStationClick?.(station.id)
            }}
          >
            <Popup>
              <div className="font-semibold text-slate-800">{station.name} Station</div>
              <div className="text-sm text-slate-600 mt-1">Crowd Level: <span className={`font-medium ${station.crowdLevel === 'High' ? 'text-red-500' : station.crowdLevel === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>{station.crowdLevel}</span></div>
              <div className="text-xs text-slate-500 mt-1">Click to view buses here</div>
            </Popup>
          </Marker>
        ))}

        {/* Draw Buses */}
        {buses.map(bus => {
          const route = routes.find(r => r.id === bus.routeId);
          const nextStation = stations.find(s => s.id === bus.nextStationId);
          
          return (
            <Marker 
              key={bus.id} 
              position={[bus.lat, bus.lng]}
              icon={createBusIcon(route?.color || '#3b82f6', bus.crowdLevel)}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <div className="font-bold text-lg mb-1 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: route?.color }}></span>
                    Bus {bus.id.toUpperCase()}
                  </div>
                  <div className="text-sm text-slate-500 mb-3">{route?.name}</div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-slate-400" />
                      <span>Next: <span className="font-medium">{nextStation?.name || 'End of Line'}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>ETA: <span className="font-medium">{bus.etaToNext ? `${Math.round(bus.etaToNext)} min` : 'N/A'}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Crowd: <span className={`font-medium ${bus.crowdLevel === 'High' ? 'text-red-500' : bus.crowdLevel === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>{bus.crowdLevel}</span></span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
