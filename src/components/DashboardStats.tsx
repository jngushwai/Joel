import { Bus, Station } from '../types';
import { Bus as BusIcon, MapPin, Users, Activity } from 'lucide-react';

interface StatsProps {
  buses: Bus[];
  stations: Station[];
}

export default function DashboardStats({ buses, stations }: StatsProps) {
  const activeBuses = buses.length;
  const highCrowdBuses = buses.filter(b => b.crowdLevel === 'High').length;
  const totalStations = stations.length;
  
  // Calculate average speed
  const avgSpeed = buses.length > 0 
    ? Math.round(buses.reduce((acc, bus) => acc + bus.speed, 0) / buses.length) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <BusIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Active Buses</p>
          <h3 className="text-2xl font-bold text-slate-900">{activeBuses}</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Total Stations</p>
          <h3 className="text-2xl font-bold text-slate-900">{totalStations}</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">High Crowd Alerts</p>
          <h3 className="text-2xl font-bold text-slate-900">{highCrowdBuses}</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Avg Network Speed</p>
          <h3 className="text-2xl font-bold text-slate-900">{avgSpeed} km/h</h3>
        </div>
      </div>
    </div>
  );
}
