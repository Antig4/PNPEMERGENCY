import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Incident, PatrolOfficer, PoliceStation } from '../types';
import { ShieldAlert, Car, Building2, Layers, Flame, Eye, EyeOff, Activity, Filter, Info } from 'lucide-react';

interface LiveGISMapProps {
  incidents: Incident[];
  patrols: PatrolOfficer[];
  stations: PoliceStation[];
  selectedIncident?: Incident | null;
  onSelectIncident?: (incident: Incident) => void;
  onSelectStation?: (station: PoliceStation) => void;
  enableHeatmap?: boolean;
}

export interface HeatmapZone {
  id: string;
  lat: number;
  lng: number;
  count: number;
  incidents: Incident[];
  densityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  color: string;
  fillColor: string;
  borderColor: string;
}

// Compute spatial clusters for incident heatmap density
function computeHeatmapZones(incidents: Incident[], radiusKm: number = 0.6): HeatmapZone[] {
  const clusters: { lat: number; lng: number; incidents: Incident[] }[] = [];

  incidents.forEach((inc) => {
    if (!inc.latitude || !inc.longitude) return;

    let found = false;
    for (const cluster of clusters) {
      const latDiff = (inc.latitude - cluster.lat) * 111;
      const lngDiff = (inc.longitude - cluster.lng) * 111 * Math.cos((cluster.lat * Math.PI) / 180);
      const distKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

      if (distKm <= radiusKm) {
        cluster.incidents.push(inc);
        const n = cluster.incidents.length;
        cluster.lat = cluster.incidents.reduce((sum, i) => sum + i.latitude, 0) / n;
        cluster.lng = cluster.incidents.reduce((sum, i) => sum + i.longitude, 0) / n;
        found = true;
        break;
      }
    }

    if (!found) {
      clusters.push({
        lat: inc.latitude,
        lng: inc.longitude,
        incidents: [inc],
      });
    }
  });

  return clusters.map((c, idx) => {
    const count = c.incidents.length;
    let densityLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let color = '#EAB308'; // Yellow (1-3)
    let fillColor = '#EAB308';
    let borderColor = '#CA8A04';

    if (count >= 6) {
      densityLevel = 'HIGH';
      color = '#EF4444'; // Red (6+)
      fillColor = '#EF4444';
      borderColor = '#DC2626';
    } else if (count >= 3) {
      densityLevel = 'MEDIUM';
      color = '#F97316'; // Orange (3-6)
      fillColor = '#F97316';
      borderColor = '#EA580C';
    }

    return {
      id: `zone-${idx}-${c.lat.toFixed(4)}-${c.lng.toFixed(4)}`,
      lat: c.lat,
      lng: c.lng,
      count,
      incidents: c.incidents,
      densityLevel,
      color,
      fillColor,
      borderColor,
    };
  });
}

// Custom Leaflet Icons via SVG HTML DivIcons
const createMarkerIcon = (color: string, label: string, iconType: 'incident' | 'patrol' | 'station') => {
  let iconSvg = '';
  if (iconType === 'incident') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else if (iconType === 'patrol') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;
  } else {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`;
  }

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 2px solid #FFFFFF;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        ${iconSvg}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

// Map Recenter Helper Component
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

export const LiveGISMap: React.FC<LiveGISMapProps> = ({
  incidents,
  patrols,
  stations,
  selectedIncident,
  onSelectIncident,
  onSelectStation,
  enableHeatmap = false,
}) => {
  // Center of Butuan City (Default project target GIS area)
  const defaultCenter: [number, number] = [8.9475, 125.5406];

  // Heatmap State
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatmapFilter, setHeatmapFilter] = useState<'all' | 'active'>('all');

  // Compute filtered incidents for heatmap
  const filteredIncidentsForHeatmap = useMemo(() => {
    if (heatmapFilter === 'active') {
      return incidents.filter((inc) => inc.status !== 'RESOLVED' && inc.status !== 'CANCELLED');
    }
    return incidents;
  }, [incidents, heatmapFilter]);

  // Calculate Spatial Heatmap Zones
  const heatmapZones = useMemo(() => {
    if (!enableHeatmap) return [];
    return computeHeatmapZones(filteredIncidentsForHeatmap);
  }, [enableHeatmap, filteredIncidentsForHeatmap]);

  // Statistics for the Legend Panel
  const highDensityCount = heatmapZones.filter((z) => z.densityLevel === 'HIGH').length;
  const mediumDensityCount = heatmapZones.filter((z) => z.densityLevel === 'MEDIUM').length;
  const lowDensityCount = heatmapZones.filter((z) => z.densityLevel === 'LOW').length;

  // Helper for status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'NOTIFIED':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'ACCEPTED':
      case 'RESPONDING':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'ON_SCENE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'RESOLVED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <div className="w-full h-full relative z-0 overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* OpenStreetMap Dark CartoDB Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {selectedIncident && (
          <RecenterMap lat={selectedIncident.latitude} lng={selectedIncident.longitude} />
        )}

        {/* 0. GIS Incident Heatmap Density Layers (Only if enableHeatmap is true) */}
        {enableHeatmap &&
          showHeatmap &&
          heatmapZones.map((zone) => (
            <Circle
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={480}
              pathOptions={{
                color: zone.borderColor,
                fillColor: zone.fillColor,
                fillOpacity: zone.densityLevel === 'HIGH' ? 0.55 : zone.densityLevel === 'MEDIUM' ? 0.45 : 0.35,
                weight: zone.densityLevel === 'HIGH' ? 3 : 2,
              }}
            >
              <Popup>
                <div className="p-2 space-y-2 max-w-xs">
                  <div
                    className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
                    style={{ color: zone.color }}
                  >
                    <Flame className="w-4 h-4 animate-bounce" /> {zone.densityLevel} DENSITY INCIDENT ZONE
                  </div>
                  <h4 className="text-sm font-black text-white">
                    {zone.count} Incident{zone.count > 1 ? 's' : ''} Mapped in this Area
                  </h4>
                  <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-700">
                    <p className="font-bold text-slate-400">Recent Reports in Zone:</p>
                    {zone.incidents.slice(0, 4).map((inc) => (
                      <div key={inc.id} className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-white">{inc.referenceNumber}</span>
                        <span className="text-slate-300">{inc.emergencyType}</span>
                      </div>
                    ))}
                    {zone.incidents.length > 4 && (
                      <p className="text-[10px] text-slate-400 italic">
                        + {zone.incidents.length - 4} additional incident records
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Circle>
          ))}

        {/* 1. Police Station Markers */}
        {stations.map((station) => (
          <Marker
            key={`station-${station.id}`}
            position={[station.latitude, station.longitude]}
            icon={createMarkerIcon('#2563EB', station.stationCode, 'station')}
            eventHandlers={{
              click: () => onSelectStation && onSelectStation(station),
            }}
          >
            <Popup>
              <div className="p-2 space-y-1.5 max-w-xs">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4" /> Police Station Desk
                </div>
                <h4 className="text-sm font-black text-white">{station.stationName}</h4>
                <p className="text-xs text-slate-300 font-mono">{station.stationCode}</p>
                <div className="pt-2 border-t border-slate-700 text-xs text-slate-300 space-y-1">
                  <p>Patrol Units: <strong className="text-white">{station.totalPatrols}</strong> (Available: <strong className="text-emerald-400">{station.availablePatrols}</strong>)</p>
                  <p>Active Incidents: <strong className="text-amber-400">{station.activeIncidents}</strong></p>
                  <p className="text-[11px] text-slate-400 mt-1">📞 {station.contactNumber}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 2. Patrol Officer Markers */}
        {patrols
          .filter((p) => p.availabilityStatus !== 'OFF_DUTY' && p.availabilityStatus !== 'OFFLINE')
          .map((patrol) => {
            const assignedInc = incidents.find(
              (inc) => inc.assignedPatrolId === patrol.id && inc.status !== 'RESOLVED' && inc.status !== 'CANCELLED'
            );

            let lat = patrol.currentLatitude;
            let lng = patrol.currentLongitude;

            // If officer is ON_SCENE or assigned incident is ON_SCENE, place officer marker directly at incident coordinates (red marker location)
            if (
              (patrol.availabilityStatus === 'ON_SCENE' || assignedInc?.status === 'ON_SCENE') &&
              assignedInc?.latitude &&
              assignedInc?.longitude
            ) {
              lat = assignedInc.latitude;
              lng = assignedInc.longitude;
            }

            if (!lat || !lng) return null;

            let color = '#10B981'; // AVAILABLE (Green)
            if (patrol.availabilityStatus === 'RESPONDING') color = '#3B82F6'; // RESPONDING (Blue)
            if (patrol.availabilityStatus === 'ON_SCENE' || assignedInc?.status === 'ON_SCENE') color = '#F59E0B'; // ON_SCENE (Orange)

            return (
              <Marker
                key={`patrol-${patrol.id}`}
                position={[lat, lng]}
                icon={createMarkerIcon(color, patrol.unitName, 'patrol')}
              >
                <Popup>
                  <div className="p-2 space-y-1.5 max-w-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Car className="w-3.5 h-3.5" /> {patrol.unitName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{patrol.badgeNumber}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{patrol.officerName}</h4>
                    <p className="text-xs text-slate-300">Station: {patrol.stationName}</p>
                    <div className="pt-1.5 flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        STATUS: {patrol.availabilityStatus}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 3. Emergency Incident Markers */}
        {incidents
          .filter((inc) => inc.status !== 'RESOLVED' && inc.status !== 'CANCELLED')
          .map((incident) => (
            <Marker
              key={`incident-${incident.id}`}
              position={[incident.latitude, incident.longitude]}
              icon={createMarkerIcon('#EF4444', incident.referenceNumber, 'incident')}
              eventHandlers={{
                click: () => onSelectIncident && onSelectIncident(incident),
              }}
            >
              <Popup>
                <div className="p-2 space-y-2 max-w-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-red-400 flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4" /> {incident.referenceNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(incident.status)}`}>
                      {incident.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{incident.emergencyType}</h4>
                    <p className="text-xs text-slate-400">{new Date(incident.reportedAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1 pt-1.5 border-t border-slate-700">
                    <p>Patrol: <strong className="text-blue-400">{incident.assignedPatrolName || 'Pending Dispatch'}</strong></p>
                    <p>Station: <strong className="text-slate-200">{incident.assignedStationName || 'Station Desk'}</strong></p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 4. Live Response Route Polylines */}
        {incidents.map((incident) => {
          if (!incident.assignedPatrolId) return null;
          const assignedPatrol = patrols.find((p) => p.id === incident.assignedPatrolId);
          if (
            !assignedPatrol ||
            !assignedPatrol.currentLatitude ||
            !assignedPatrol.currentLongitude ||
            (incident.status !== 'RESPONDING' && incident.status !== 'ON_SCENE')
          ) {
            return null;
          }

          return (
            <Polyline
              key={`route-${incident.id}`}
              positions={[
                [assignedPatrol.currentLatitude, assignedPatrol.currentLongitude],
                [incident.latitude, incident.longitude],
              ]}
              pathOptions={{
                color: incident.status === 'RESPONDING' ? '#3B82F6' : '#F59E0B',
                weight: 4,
                dashArray: '8, 8',
                opacity: 0.8,
              }}
            />
          );
        })}
      </MapContainer>

      {/* Floating Right-Side Heatmap Color-Coding & Controls Panel (Only on Full Live GIS Map) */}
      {enableHeatmap && (
        <div className="absolute top-4 right-4 z-[1000] w-72 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4">
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
              <div>
                <h3 className="text-xs font-black text-white tracking-wider uppercase">
                  GIS Incident Heatmap
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  Spatial Density Analysis
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`p-1.5 rounded-lg border transition-all ${
                showHeatmap
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title={showHeatmap ? 'Disable Heatmap Layer' : 'Enable Heatmap Layer'}
            >
              {showHeatmap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          {/* Filter Toggle Controls */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setHeatmapFilter('all')}
              className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg transition-all ${
                heatmapFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => setHeatmapFilter('active')}
              className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg transition-all ${
                heatmapFilter === 'active'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Only
            </button>
          </div>

          {/* Color Coding Reference Legend */}
          <div className="space-y-2.5 pt-1">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" /> Color Coding Scale
            </p>

            {/* High Density (6+ Incidents) - RED */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-white/40" />
                <div>
                  <p className="text-xs font-black text-red-400">High Density / Hotspot</p>
                  <p className="text-[10px] text-slate-400 font-medium">6+ Incidents Reported</p>
                </div>
              </div>
              <span className="text-xs font-black text-red-300 font-mono">{highDensityCount}</span>
            </div>

            {/* Medium Density (3-6 Incidents) - ORANGE */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] border border-white/40" />
                <div>
                  <p className="text-xs font-black text-amber-400">Medium Density Zone</p>
                  <p className="text-[10px] text-slate-400 font-medium">3 to 6 Incidents Reported</p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-300 font-mono">{mediumDensityCount}</span>
            </div>

            {/* Low Density (1-3 Incidents) - YELLOW */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] border border-white/40" />
                <div>
                  <p className="text-xs font-black text-yellow-400">Low Density Zone</p>
                  <p className="text-[10px] text-slate-400 font-medium">1 to 3 Incidents Reported</p>
                </div>
              </div>
              <span className="text-xs font-black text-yellow-300 font-mono">{lowDensityCount}</span>
            </div>
          </div>

          {/* Live Density Analytics Footer */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Activity className="w-3 h-3 text-blue-400" /> Active Zones: <strong className="text-white">{heatmapZones.length}</strong>
            </span>
            <span className="font-mono text-slate-500">
              {filteredIncidentsForHeatmap.length} Mapped
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
