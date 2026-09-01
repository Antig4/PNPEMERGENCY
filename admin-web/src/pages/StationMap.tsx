import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { LiveGISMap } from '../components/LiveGISMap';
import { useAuth } from '../context/AuthContext';
import { stationService } from '../services/stationService';
import { Incident, PatrolOfficer, PoliceStation } from '../types';

export const StationMap: React.FC = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [patrols, setPatrols] = useState<PatrolOfficer[]>([]);
  const [stations, setStations] = useState<PoliceStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const loadMapData = useCallback(async () => {
    try {
      const [incData, patData, dashData] = await Promise.all([
        stationService.getIncidents(),
        stationService.getPatrols(),
        stationService.getDashboard(),
      ]);
      setIncidents(incData);
      setPatrols(patData);
      // Build a single-station array from the dashboard response
      if (dashData.station) {
        setStations([dashData.station as unknown as PoliceStation]);
      }
    } catch (e) {
      console.warn('StationMap fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMapData();
    const interval = setInterval(loadMapData, 5000);
    return () => clearInterval(interval);
  }, [loadMapData]);

  const stationName = user?.station?.station_name || user?.station?.name || 'Station GIS Map';

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      <Header
        title="Station Live GIS Map"
        subtitle={stationName}
        onRefresh={loadMapData}
        isRefreshing={isLoading}
      />
      <div className="flex-1 p-6 overflow-hidden">
        <LiveGISMap
          incidents={incidents}
          patrols={patrols}
          stations={stations}
          selectedIncident={selectedIncident}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
          enableHeatmap={false}
        />
      </div>
    </div>
  );
};
