import { Station } from '../types';
import { Users, MapPin } from 'lucide-react';

interface StationListProps {
  stations: Station[];
  selectedStationId: string | null;
  onStationClick: (id: string) => void;
}

export default function StationList({ stations, selectedStationId, onStationClick }: StationListProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800">Network Stations</h2>
        <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
          {stations.length} Stations
        </span>
      </div>
      
      <div className="overflow-y-auto flex-1 p-2">
        <div className="space-y-2">
          {stations.map(station => (
            <div 
              key={station.id} 
              onClick={() => onStationClick(station.id)}
              className={`p-3 rounded-lg border transition-colors cursor-pointer shadow-sm ${
                selectedStationId === station.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-100 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className={`w-4 h-4 ${selectedStationId === station.id ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="font-bold text-slate-800">{station.name}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  station.crowdLevel === 'High' ? 'bg-red-100 text-red-700' : 
                  station.crowdLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {station.crowdLevel} Crowd
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Current Status: <span className="font-medium">{station.crowdLevel}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
