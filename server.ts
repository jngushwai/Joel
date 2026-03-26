import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

const PORT = 3000;

// DART Stations
const stations = [
  { id: 's1', name: 'Kimara', lat: -6.7865, lng: 39.1825 },
  { id: 's2', name: 'Ubungo', lat: -6.7905, lng: 39.2155 },
  { id: 's3', name: 'Magomeni', lat: -6.8045, lng: 39.2565 },
  { id: 's4', name: 'Fire', lat: -6.8115, lng: 39.2735 },
  { id: 's5', name: 'Kivukoni', lat: -6.8185, lng: 39.2965 },
  { id: 's6', name: 'Gerezani', lat: -6.8225, lng: 39.2845 },
  { id: 's7', name: 'Morocco', lat: -6.7775, lng: 39.2565 },
];

// Routes (sequences of station IDs)
const routes = [
  { id: 'r1', name: 'Kimara - Kivukoni', path: ['s1', 's2', 's3', 's4', 's5'], color: '#3b82f6' }, // Blue
  { id: 'r2', name: 'Kimara - Gerezani', path: ['s1', 's2', 's3', 's4', 's6'], color: '#ef4444' }, // Red
  { id: 'r3', name: 'Morocco - Kivukoni', path: ['s7', 's3', 's4', 's5'], color: '#10b981' }, // Green
];

// Helper to get distance between two coords in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

// Initialize some buses
let buses = [
  { id: 'b1', routeId: 'r1', direction: 1, currentStationIndex: 0, progress: 0, crowdLevel: 'Low', speed: 40 }, // km/h
  { id: 'b2', routeId: 'r1', direction: -1, currentStationIndex: 4, progress: 0, crowdLevel: 'Medium', speed: 45 },
  { id: 'b3', routeId: 'r2', direction: 1, currentStationIndex: 1, progress: 0.5, crowdLevel: 'High', speed: 35 },
  { id: 'b4', routeId: 'r3', direction: 1, currentStationIndex: 0, progress: 0.2, crowdLevel: 'Low', speed: 50 },
  { id: 'b5', routeId: 'r3', direction: -1, currentStationIndex: 3, progress: 0.8, crowdLevel: 'Medium', speed: 40 },
];

function getStation(id: string) {
  return stations.find(s => s.id === id)!;
}

function calculateBusPosition(bus: any) {
  const route = routes.find(r => r.id === bus.routeId)!;
  const currentStationId = route.path[bus.currentStationIndex];
  
  let nextStationIndex = bus.currentStationIndex + bus.direction;
  if (nextStationIndex < 0 || nextStationIndex >= route.path.length) {
    // Reached end of line, wait at station
    return { ...getStation(currentStationId), nextStationId: null, distanceToNext: 0, etaToNext: 0 };
  }
  
  const nextStationId = route.path[nextStationIndex];
  const s1 = getStation(currentStationId);
  const s2 = getStation(nextStationId);
  
  const lat = s1.lat + (s2.lat - s1.lat) * bus.progress;
  const lng = s1.lng + (s2.lng - s1.lng) * bus.progress;
  
  const totalDist = getDistance(s1.lat, s1.lng, s2.lat, s2.lng);
  const distanceToNext = totalDist * (1 - bus.progress);
  const etaToNext = (distanceToNext / bus.speed) * 60; // in minutes
  
  return { lat, lng, nextStationId, distanceToNext, etaToNext };
}

// Simulation loop
setInterval(() => {
  buses.forEach(bus => {
    const route = routes.find(r => r.id === bus.routeId)!;
    let nextStationIndex = bus.currentStationIndex + bus.direction;
    
    if (nextStationIndex < 0 || nextStationIndex >= route.path.length) {
      // Turn around after a short delay (simulated by just flipping direction)
      bus.direction *= -1;
      bus.progress = 0;
      // Randomize crowd level on turnaround
      const levels = ['Low', 'Medium', 'High'];
      bus.crowdLevel = levels[Math.floor(Math.random() * levels.length)];
      return;
    }
    
    const s1 = getStation(route.path[bus.currentStationIndex]);
    const s2 = getStation(route.path[nextStationIndex]);
    const dist = getDistance(s1.lat, s1.lng, s2.lat, s2.lng);
    
    // Update progress based on speed (speed is km/h, interval is 1s)
    // progress increment = (speed / 3600) / dist
    const progressInc = (bus.speed / 3600) / dist;
    bus.progress += progressInc;
    
    if (bus.progress >= 1) {
      bus.currentStationIndex = nextStationIndex;
      bus.progress = 0;
      // Randomize crowd level slightly at stations
      if (Math.random() > 0.7) {
        const levels = ['Low', 'Medium', 'High'];
        bus.crowdLevel = levels[Math.floor(Math.random() * levels.length)];
      }
    }
  });
}, 1000);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/network', (req, res) => {
    res.json({ stations, routes });
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Send initial data
    const busData = buses.map(bus => {
      const pos = calculateBusPosition(bus);
      return { ...bus, ...pos };
    });
    socket.emit('bus_update', busData);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Broadcast bus positions every 2 seconds
  setInterval(() => {
    const busData = buses.map(bus => {
      const pos = calculateBusPosition(bus);
      return { ...bus, ...pos };
    });
    io.emit('bus_update', busData);
  }, 2000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
