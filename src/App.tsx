import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Bus, Route, Station } from './types';
import Map from './components/Map';
import DashboardStats from './components/DashboardStats';
import BusList from './components/BusList';
import StationList from './components/StationList';
import { Bus as BusIcon, Menu, Bell, Search, UserCircle, MapPin, Filter, X, List, Map as MapIcon } from 'lucide-react';

export default function App() {
  const [stations, setStations] = useState<Station[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('all');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [view, setView] = useState<'buses' | 'stations'>('buses');

  useEffect(() => {
    // Fetch static network data
    fetch('/api/network')
      .then(res => res.json())
      .then(data => {
        setStations(data.stations);
        setRoutes(data.routes);
      });

    // Connect to WebSocket for real-time bus updates
    const socket = io();

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('bus_update', (data: Bus[]) => {
      setBuses(data);
    });

    socket.on('station_update', (data: Station[]) => {
      setStations(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  let filteredBuses = buses;
  if (selectedRouteId !== 'all') {
    filteredBuses = filteredBuses.filter(b => b.routeId === selectedRouteId);
  }
  if (selectedStationId) {
    filteredBuses = filteredBuses.filter(b => {
      const route = routes.find(r => r.id === b.routeId);
      if (!route) return false;
      const currentStationId = route.path[b.currentStationIndex];
      return b.nextStationId === selectedStationId || currentStationId === selectedStationId;
    });
  }

  let filteredRoutes = routes;
  if (selectedRouteId !== 'all') {
    filteredRoutes = filteredRoutes.filter(r => r.id === selectedRouteId);
  }
  if (selectedStationId) {
    filteredRoutes = filteredRoutes.filter(r => r.path.includes(selectedStationId));
  }

  const activeStationIds = new Set(filteredRoutes.flatMap(r => r.path));
  const filteredStations = selectedRouteId === 'all' && !selectedStationId
    ? stations
    : stations.filter(s => activeStationIds.has(s.id));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100 rounded-lg lg:hidden">
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BusIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">DART Smart BRT</h1>
              <p className="text-xs font-medium text-slate-500">Live Operations Dashboard</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
              <Filter className="w-4 h-4 text-slate-400 mr-2" />
              <select
                value={selectedRouteId}
                onChange={(e) => {
                  setSelectedRouteId(e.target.value);
                  setSelectedStationId(null);
                }}
                className="bg-transparent border-none outline-none text-sm text-slate-700 cursor-pointer pr-2"
              >
                <option value="all">All Routes</option>
                {routes.map(route => (
                  <option key={route.id} value={route.id}>{route.name}</option>
                ))}
              </select>
            </div>

            {selectedStationId && (
              <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium border border-blue-200">
                <MapPin className="w-4 h-4 mr-1.5" />
                <span>{stations.find(s => s.id === selectedStationId)?.name}</span>
                <button 
                  onClick={() => setSelectedStationId(null)}
                  className="ml-2 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  title="Clear station filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center bg-slate-100 px-4 py-2 rounded-full border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search bus, station..." 
              className="bg-transparent border-none outline-none text-sm w-48 text-slate-700 placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 hover:bg-slate-100 rounded-full relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            </div>
            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1 pr-3 rounded-full transition-colors">
              <UserCircle className="w-8 h-8 text-slate-400" />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-700">Operator Admin</p>
                <p className="text-xs text-slate-500">Control Center</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col max-w-7xl mx-auto w-full">
        {/* Connection Status Banner */}
        {!isConnected && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 shadow-sm">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-medium">Connecting to live feed...</p>
          </div>
        )}

        <DashboardStats buses={filteredBuses} stations={filteredStations} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[600px]">
          {/* Left Column: Map */}
          <div className="lg:col-span-2 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Live Network Map
              </h2>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live
                </span>
                <span className="mx-1">•</span>
                <span>Updating every 2s</span>
              </div>
            </div>
            <div className="flex-1 relative z-0">
              {stations.length > 0 ? (
                <Map 
                  stations={filteredStations} 
                  routes={filteredRoutes} 
                  buses={filteredBuses} 
                  onRouteClick={(routeId) => {
                    setSelectedRouteId(routeId);
                    setSelectedStationId(null);
                  }}
                  onStationClick={(stationId) => setSelectedStationId(stationId)}
                  selectedStationId={selectedStationId}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <MapPin className="w-8 h-8 animate-bounce" />
                    <p className="font-medium">Loading map data...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Bus/Station List */}
          <div className="lg:col-span-1 h-[600px] lg:h-auto flex flex-col gap-4">
            <div className="flex bg-slate-200 p-1 rounded-lg">
              <button 
                onClick={() => setView('buses')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${view === 'buses' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                <BusIcon className="w-4 h-4" /> Buses
              </button>
              <button 
                onClick={() => setView('stations')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${view === 'stations' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                <MapIcon className="w-4 h-4" /> Stations
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {view === 'buses' ? (
                <BusList buses={filteredBuses} routes={routes} stations={stations} />
              ) : (
                <StationList 
                  stations={filteredStations} 
                  selectedStationId={selectedStationId} 
                  onStationClick={(id) => setSelectedStationId(id)} 
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
