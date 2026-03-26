import { Bus, Route, Station } from '../types';
import { Clock, Navigation, Users } from 'lucide-react';

interface BusListProps {
  buses: Bus[];
  routes: Route[];
  stations: Station[];
}

export default function BusList({ buses, routes, stations }: BusListProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800">Active Fleet</h2>
        <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          {buses.length} Buses
        </span>
      </div>
      
      <div className="overflow-y-auto flex-1 p-2">
        <div className="space-y-2">
          {buses.map(bus => {
            const route = routes.find(r => r.id === bus.routeId);
            const nextStation = stations.find(s => s.id === bus.nextStationId);
            
            return (
              <div key={bus.id} className="p-3 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors bg-white shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: route?.color || '#3b82f6' }}
                    />
                    <span className="font-bold text-slate-800">Bus {bus.id.toUpperCase()}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    bus.crowdLevel === 'High' ? 'bg-red-100 text-red-700' : 
                    bus.crowdLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {bus.crowdLevel} Crowd
                  </span>
                </div>
                
                <div className="text-sm text-slate-500 mb-3 font-medium">
                  {route?.name}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Navigation className="w-4 h-4 text-slate-400" />
                    <span className="truncate" title={nextStation?.name || 'End of Line'}>
                      {nextStation?.name || 'End of Line'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 justify-end">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">
                      {bus.etaToNext ? `${Math.round(bus.etaToNext)} min` : 'N/A'}
                    </span>
                  </div>
                </div>
                
                {/* Progress bar to next station */}
                {bus.nextStationId && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{stations.find(s => s.id === route?.path[bus.currentStationIndex])?.name}</span>
                      <span>{nextStation?.name}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-linear"
                        style={{ 
                          width: `${bus.progress * 100}%`,
                          backgroundColor: route?.color || '#3b82f6'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
